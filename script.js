document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons'); // Changement ici
    const pkInput = document.getElementById('pkInput');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');

    let portesData = [];
    let selectedAutoroute = ''; // Nouvelle variable pour stocker l'autoroute sélectionnée
    let selectedDirection = ''; // Variable pour stocker le sens sélectionné

    // --- Gestion du thème Jour/Nuit ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        themeToggle.checked = (currentTheme === 'light-mode');
    } else {
        document.body.classList.add('dark-mode');
        themeToggle.checked = false;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
    });

    // --- Chargement des données des portes ---
    async function loadPortesData() {
        try {
            const response = await fetch('portes_autoroute.json');
            portesData = await response.json();
            console.log('Données chargées :', portesData);
            populateAutorouteButtons(); // Remplir les boutons d'autoroutes
        } catch (error) {
            console.error('Erreur lors du chargement des données des portes :', error);
            resultsDiv.innerHTML = '<h2>Erreur</h2><p style="color: red;">Impossible de charger les données des portes. Veuillez réessayer plus tard.</p>';
        }
    }

    // --- Fonction pour remplir les boutons d'autoroutes ---
    function populateAutorouteButtons() {
        const uniqueAutoroutes = [...new Set(portesData.map(porte => porte.Autoroute))].sort();
        autorouteButtonsContainer.innerHTML = ''; // Nettoyer les anciens boutons

        if (uniqueAutoroutes.length === 0) {
            autorouteButtonsContainer.innerHTML = '<p>Aucune autoroute disponible.</p>';
            return;
        }

        uniqueAutoroutes.forEach(autoroute => {
            const button = document.createElement('button');
            button.className = 'autoroute-button';
            button.textContent = autoroute;
            button.setAttribute('data-autoroute', autoroute);
            button.addEventListener('click', () => {
                // Supprimer la classe 'selected' de tous les boutons d'autoroute
                document.querySelectorAll('.autoroute-button').forEach(btn => btn.classList.remove('selected'));
                // Ajouter la classe 'selected' au bouton cliqué
                button.classList.add('selected');
                selectedAutoroute = autoroute; // Mettre à jour l'autoroute sélectionnée
                updateDirectionButtons(); // Mettre à jour les boutons de direction
            });
            autorouteButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Sélectionnez une autoroute et entrez un PK pour trouver une porte.</p>';
        // Initialiser les boutons de direction au cas où
        updateDirectionButtons();
    }

    // --- Fonction pour mettre à jour les boutons de direction en fonction de l'autoroute sélectionnée ---
    function updateDirectionButtons() {
        directionButtonsContainer.innerHTML = ''; // Nettoyer les anciens boutons
        selectedDirection = ''; // Réinitialiser le sens sélectionné

        if (!selectedAutoroute) { // Utilise la nouvelle variable selectedAutoroute
            directionButtonsContainer.innerHTML = '<p>Veuillez sélectionner une autoroute d\'abord.</p>';
            return;
        }

        const portesForSelectedAutoroute = portesData.filter(porte => porte.Autoroute === selectedAutoroute);
        const uniqueSens = [...new Set(portesForSelectedAutoroute.map(porte => porte.Sens))].sort();

        if (uniqueSens.length === 0) {
            directionButtonsContainer.innerHTML = '<p>Aucun sens disponible pour cette autoroute.</p>';
            return;
        }

        uniqueSens.forEach(sens => {
            const button = document.createElement('button');
            button.className = 'direction-button';
            button.textContent = sens;
            button.setAttribute('data-direction', sens);
            button.addEventListener('click', () => {
                document.querySelectorAll('.direction-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedDirection = sens;
            });
            directionButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Entrez un PK et sélectionnez un sens pour trouver une porte.</p>';
    }

    // --- Fonction de recherche de la porte la plus proche ---
    searchButton.addEventListener('click', () => {
        const targetPk = parseFloat(pkInput.value.replace(',', '.')); // IMPORTANT: Convertit la virgule en point

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2>'; // Nettoyer les anciens résultats

        if (isNaN(targetPk)) {
            resultsDiv.innerHTML += '<p style="color: red;">Veuillez entrer un PK valide (un nombre).</p>';
            return;
        }

        if (!selectedAutoroute) { // Utilise la nouvelle variable selectedAutoroute
            resultsDiv.innerHTML += '<p style="color: red;">Veuillez sélectionner une autoroute.</p>';
            return;
        }

        if (!selectedDirection) {
            resultsDiv.innerHTML += '<p style="color: red;">Veuillez sélectionner un sens de circulation.</p>';
            return;
        }

        const filteredPortes = portesData.filter(porte =>
            porte.Autoroute === selectedAutoroute &&
            porte.Sens === selectedDirection
        );

        if (filteredPortes.length === 0) {
            resultsDiv.innerHTML += '<p style="color: orange;">Aucune porte trouvée pour l\'autoroute et le sens sélectionnés.</p>';
            return;
        }

        let closestPorte = null;
        let minDifference = Infinity;

        filteredPortes.forEach(porte => {
            const portePk = parseFloat(porte.PK.replace(',', '.'));
            const difference = Math.abs(targetPk - portePk);

            if (difference < minDifference) {
                minDifference = difference;
                closestPorte = porte;
            }
        });

        if (closestPorte) {
            const latitude = parseFloat(closestPorte.Latitude.trim());
            const longitude = parseFloat(closestPorte['Longitude '].trim()); // Prend en compte l'espace dans la clé

            const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

            resultsDiv.innerHTML += `
                <div class="result-item">
                    <p><strong>Autoroute :</strong> ${closestPorte.Autoroute}</p>
                    <p><strong>Sens :</strong> ${closestPorte.Sens}</p>
                    <p><strong>PK le plus proche :</strong> ${closestPorte.PK}</p>
                    <p><strong>Type d'accès :</strong> ${closestPorte['Type d\'accès'] || 'Non spécifié'}</p>
                    <p><strong>Commentaires :</strong> ${closestPorte['Commentaires'] || 'Aucun'}</p>
                    <p><strong>Route d'accès :</strong> ${closestPorte['Route d\'accès'] || 'Non spécifié'}</p>
                    ${closestPorte.Photo && closestPorte.Photo !== 'à définir' ? `<p><a href="${closestPorte.Photo}" target="_blank">Voir la photo</a></p>` : ''}
                    <a href="${mapLink}" target="_blank" class="map-link">Voir sur Google Maps</a>
                </div>
            `;
        } else {
            resultsDiv.innerHTML += '<p style="color: orange;">Aucune porte trouvée correspondant à vos critères.</p>';
        }
    });

    loadPortesData();
});
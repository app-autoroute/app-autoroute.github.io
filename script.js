document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons');
    const pkInput = document.getElementById('pkInput');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resetButton = document.getElementById('resetButton'); // Nouveau : Récupérer le bouton Réinitialiser

    let portesData = [];
    let selectedAutoroute = '';
    let selectedDirection = '';

    const LOCAL_STORAGE_PREFIX = 'autorouteApp_'; // Préfixe pour éviter les conflits
    const LAST_AUTOROUTE_KEY = LOCAL_STORAGE_PREFIX + 'lastAutoroute';
    const LAST_DIRECTION_KEY = LOCAL_STORAGE_PREFIX + 'lastDirection';
    const LAST_PK_KEY = LOCAL_STORAGE_PREFIX + 'lastPk';
    const THEME_KEY = LOCAL_STORAGE_PREFIX + 'theme';

    // --- Gestion du thème Jour/Nuit ---
    // Charger le thème depuis localStorage ou utiliser le mode nuit par défaut
    const currentTheme = localStorage.getItem(THEME_KEY);
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        themeToggle.checked = (currentTheme === 'light-mode');
    } else {
        // Mode Nuit par défaut si aucun thème n'est défini
        document.body.classList.add('dark-mode');
        themeToggle.checked = false;
    }

    // Basculer le thème
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem(THEME_KEY, 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem(THEME_KEY, 'dark-mode');
        }
    });

    // --- Chargement des données des portes ---
    async function loadPortesData() {
        try {
            const response = await fetch('portes_autoroute.json');
            portesData = await response.json();
            console.log('Données chargées :', portesData);
            populateAutorouteButtons(); // Remplir les boutons d'autoroutes
            loadLastSelections(); // Charger les dernières sélections après avoir peuplé les boutons
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
                localStorage.setItem(LAST_AUTOROUTE_KEY, autoroute); // Sauvegarder l'autoroute
                updateDirectionButtons(); // Mettre à jour les boutons de direction
            });
            autorouteButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Sélectionnez une autoroute et entrez un PK pour trouver une porte.</p>';
    }

    // --- Fonction pour mettre à jour les boutons de direction en fonction de l'autoroute sélectionnée ---
    function updateDirectionButtons() {
        directionButtonsContainer.innerHTML = ''; // Nettoyer les anciens boutons
        selectedDirection = ''; // Réinitialiser le sens sélectionné pour éviter de garder un sens d'une autre autoroute

        if (!selectedAutoroute) {
            directionButtonsContainer.innerHTML = '<p>Veuillez sélectionner une autoroute d\'abord.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY); // Supprimer la dernière direction si pas d'autoroute
            return;
        }

        const portesForSelectedAutoroute = portesData.filter(porte => porte.Autoroute === selectedAutoroute);
        const uniqueSens = [...new Set(portesForSelectedAutoroute.map(porte => porte.Sens))].sort();

        if (uniqueSens.length === 0) {
            directionButtonsContainer.innerHTML = '<p>Aucun sens disponible pour cette autoroute.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
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
                localStorage.setItem(LAST_DIRECTION_KEY, sens); // Sauvegarder le sens
            });
            directionButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Entrez un PK et sélectionnez un sens pour trouver une porte.</p>';

        // Tenter de présélectionner le dernier sens si l'autoroute correspond
        const lastDirection = localStorage.getItem(LAST_DIRECTION_KEY);
        if (lastDirection && uniqueSens.includes(lastDirection)) {
            // Trouver le bouton correspondant et simuler un clic pour le sélectionner
            const lastDirectionButton = document.querySelector(`.direction-button[data-direction="${lastDirection}"]`);
            if (lastDirectionButton) {
                lastDirectionButton.click(); // Simule le clic pour appliquer la sélection et sauvegarder
            }
        }
    }

    // --- Charger les dernières sélections au démarrage ---
    function loadLastSelections() {
        const lastAutoroute = localStorage.getItem(LAST_AUTOROUTE_KEY);
        const lastPk = localStorage.getItem(LAST_PK_KEY);

        if (lastAutoroute) {
            // Trouver le bouton correspondant et simuler un clic pour le sélectionner
            const lastAutorouteButton = document.querySelector(`.autoroute-button[data-autoroute="${lastAutoroute}"]`);
            if (lastAutorouteButton) {
                lastAutorouteButton.click(); // Simule le clic pour appliquer la sélection et sauvegarder
            }
        }

        if (lastPk) {
            pkInput.value = lastPk; // Pré-remplir le champ PK
        }

        // Si tout est chargé (autoroute, direction, PK), relancer la recherche automatiquement
        // On attend un court instant pour s'assurer que les boutons de direction ont eu le temps de se générer
        // et que le "click" sur l'autoroute a bien mis à jour selectedAutoroute et selectedDirection.
        setTimeout(() => {
            if (selectedAutoroute && selectedDirection && pkInput.value) {
                searchButton.click(); // Simuler un clic sur le bouton de recherche
            }
        }, 100); // Délai de 100ms
    }

    // --- Fonction de réinitialisation du formulaire ---
    function resetForm() {
        // Effacer les sélections et les valeurs
        selectedAutoroute = '';
        selectedDirection = '';
        pkInput.value = '';

        // Désélectionner les boutons
        document.querySelectorAll('.autoroute-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.direction-button').forEach(btn => btn.classList.remove('selected'));

        // Effacer les données du localStorage
        localStorage.removeItem(LAST_AUTOROUTE_KEY);
        localStorage.removeItem(LAST_DIRECTION_KEY);
        localStorage.removeItem(LAST_PK_KEY);

        // Mettre à jour l'affichage des sens et des résultats
        updateDirectionButtons(); // Pour afficher "Veuillez sélectionner une autoroute d'abord."
        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Entrez un PK et sélectionnez un sens pour trouver une porte.</p>';
    }

    // --- Écouteur d'événement pour le bouton Réinitialiser ---
    resetButton.addEventListener('click', resetForm);

    // --- Fonction de recherche de la porte la plus proche ---
    searchButton.addEventListener('click', () => {
        const targetPk = parseFloat(pkInput.value.replace(',', '.')); // IMPORTANT: Convertit la virgule en point

        // Sauvegarder le PK seulement si la saisie est valide
        if (!isNaN(targetPk)) {
            localStorage.setItem(LAST_PK_KEY, pkInput.value);
        } else {
            localStorage.removeItem(LAST_PK_KEY); // Supprimer le PK si la saisie n'est pas valide
        }

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2>'; // Nettoyer les anciens résultats

        if (isNaN(targetPk)) {
            resultsDiv.innerHTML += '<p style="color: red;">Veuillez entrer un PK valide (un nombre).</p>';
            return;
        }

        if (!selectedAutoroute) {
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

            // Utilisation d'un format de lien plus robuste pour Google Maps
            const mapLink = `http://maps.google.com/maps?q=${latitude},${longitude}`; // Format le plus standard pour les coordonnées


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

    // Charger les données au démarrage de l'application
    loadPortesData();
});
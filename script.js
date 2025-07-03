document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('checkbox');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons');
    const pkInput = document.getElementById('pkInput');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resetButton = document.getElementById('resetButton');

    let portesData = [];
    let selectedAutoroute = '';
    let selectedDirection = '';

    const LOCAL_STORAGE_PREFIX = 'autorouteApp_';
    const LAST_AUTOROUTE_KEY = LOCAL_STORAGE_PREFIX + 'lastAutoroute';
    const LAST_DIRECTION_KEY = LOCAL_STORAGE_PREFIX + 'lastDirection';
    const LAST_PK_KEY = LOCAL_STORAGE_PREFIX + 'lastPk';
    const THEME_KEY = LOCAL_STORAGE_PREFIX + 'theme';

    // --- Gestion du thème Jour/Nuit ---
    const currentTheme = localStorage.getItem(THEME_KEY);
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
            // Assurez-vous que les PK sont bien des nombres pour le tri
            portesData.forEach(porte => {
                porte.PK_Num = parseFloat(porte.PK.replace(',', '.'));
            });
            console.log('Données chargées et PK convertis :', portesData);
            populateAutorouteButtons();
            loadLastSelections();
        } catch (error) {
            console.error('Erreur lors du chargement des données des portes :', error);
            resultsDiv.innerHTML = '<h2>Erreur</h2><p style="color: red;">Impossible de charger les données des portes. Veuillez réessayer plus tard.</p>';
        }
    }

    // --- Fonction pour remplir les boutons d'autoroutes ---
    function populateAutorouteButtons() {
        const uniqueAutoroutes = [...new Set(portesData.map(porte => porte.Autoroute))].sort();
        autorouteButtonsContainer.innerHTML = '';

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
                document.querySelectorAll('.autoroute-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedAutoroute = autoroute;
                localStorage.setItem(LAST_AUTOROUTE_KEY, autoroute);
                updateDirectionButtons();
            });
            autorouteButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Sélectionnez une autoroute et entrez un PK pour trouver une porte.</p>';
    }

    // --- Fonction pour mettre à jour les boutons de direction ---
    function updateDirectionButtons() {
        directionButtonsContainer.innerHTML = '';
        selectedDirection = '';

        if (!selectedAutoroute) {
            directionButtonsContainer.innerHTML = '<p>Veuillez sélectionner une autoroute d\'abord.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
            return;
        }

        const portesForSelectedAutoroute = portesData.filter(porte => porte.Autoroute === selectedAutoroute);
        // Utiliser Set pour obtenir des sens uniques tout en conservant l'ordre original des PK si possible
        // Ou trier alphabétiquement pour une cohérence visuelle
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
                localStorage.setItem(LAST_DIRECTION_KEY, sens);
            });
            directionButtonsContainer.appendChild(button);
        });

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Entrez un PK et sélectionnez un sens pour trouver une porte.</p>';

        const lastDirection = localStorage.getItem(LAST_DIRECTION_KEY);
        if (lastDirection && uniqueSens.includes(lastDirection)) {
            const lastDirectionButton = document.querySelector(`.direction-button[data-direction="${lastDirection}"]`);
            if (lastDirectionButton) {
                lastDirectionButton.click();
            }
        }
    }

    // --- Charger les dernières sélections au démarrage ---
    function loadLastSelections() {
        const lastAutoroute = localStorage.getItem(LAST_AUTOROUTE_KEY);
        const lastPk = localStorage.getItem(LAST_PK_KEY);

        if (lastAutoroute) {
            const lastAutorouteButton = document.querySelector(`.autoroute-button[data-autoroute="${lastAutoroute}"]`);
            if (lastAutorouteButton) {
                lastAutorouteButton.click();
            }
        }

        if (lastPk) {
            pkInput.value = lastPk;
        }

        setTimeout(() => {
            if (selectedAutoroute && selectedDirection && pkInput.value) {
                searchButton.click();
            }
        }, 100);
    }

    // --- Fonction de réinitialisation du formulaire ---
    function resetForm() {
        selectedAutoroute = '';
        selectedDirection = '';
        pkInput.value = '';

        document.querySelectorAll('.autoroute-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.direction-button').forEach(btn => btn.classList.remove('selected'));

        localStorage.removeItem(LAST_AUTOROUTE_KEY);
        localStorage.removeItem(LAST_DIRECTION_KEY);
        localStorage.removeItem(LAST_PK_KEY);

        updateDirectionButtons();
        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2><p>Entrez un PK et sélectionnez un sens pour trouver une porte.</p>';
    }

    // --- Écouteur d'événement pour le bouton Réinitialiser ---
    resetButton.addEventListener('click', resetForm);

    // --- Fonction de recherche de la porte la plus proche (LOGIQUE MODIFIÉE) ---
    searchButton.addEventListener('click', () => {
        const targetPk = parseFloat(pkInput.value.replace(',', '.'));

        if (!isNaN(targetPk)) {
            localStorage.setItem(LAST_PK_KEY, pkInput.value);
        } else {
            localStorage.removeItem(LAST_PK_KEY);
        }

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2>';

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
        let minDistanceToTravel = Infinity; // Nous cherchons la plus petite distance POSITIVE à parcourir

        // Trouver la "ProgressionPK" pour le sens et l'autoroute choisis
        // On prend la première porte trouvée qui correspond aux critères de filtre pour récupérer cette info
        const progressionPK = filteredPortes[0] ? filteredPortes[0].ProgressionPK : null;

        if (!progressionPK) {
            resultsDiv.innerHTML += '<p style="color: red;">Erreur: Information de progression PK manquante pour ce sens.</p>';
            return;
        }

        // --- NOUVELLE LOGIQUE DE RECHERCHE ---
        if (progressionPK === "Ascendant") {
            // Pour un sens Ascendant, on cherche le premier PK >= PK_saisi
            const relevantPortes = filteredPortes.filter(porte => porte.PK_Num >= targetPk);

            if (relevantPortes.length > 0) {
                // Trier les portes pertinentes par PK ascendant pour trouver la plus proche après le PK actuel
                relevantPortes.sort((a, b) => a.PK_Num - b.PK_Num);
                closestPorte = relevantPortes[0]; // La première après ou au PK
            } else {
                // Si aucune porte n'est trouvée après le PK (on a dépassé toutes les portes)
                // On peut décider de montrer la dernière porte de la liste (la plus haute)
                // Ou afficher un message spécifique. Ici, on prend la dernière du sens filtré.
                filteredPortes.sort((a, b) => b.PK_Num - a.PK_Num); // Trier par PK descendant pour trouver la dernière
                closestPorte = filteredPortes[0];
                resultsDiv.innerHTML += '<p style="color: orange;">Vous avez dépassé toutes les portes dans ce sens. Affichage de la dernière porte disponible.</p>';
            }

        } else if (progressionPK === "Descendant") {
            // Pour un sens Descendant, on cherche le premier PK <= PK_saisi
            const relevantPortes = filteredPortes.filter(porte => porte.PK_Num <= targetPk);

            if (relevantPortes.length > 0) {
                // Trier les portes pertinentes par PK descendant pour trouver la plus proche avant le PK actuel
                relevantPortes.sort((a, b) => b.PK_Num - a.PK_Num);
                closestPorte = relevantPortes[0]; // La première avant ou au PK
            } else {
                // Si aucune porte n'est trouvée avant le PK (on a dépassé toutes les portes)
                // On peut décider de montrer la dernière porte de la liste (la plus basse)
                // Ou afficher un message spécifique. Ici, on prend la dernière du sens filtré.
                filteredPortes.sort((a, b) => a.PK_Num - b.PK_Num); // Trier par PK ascendant pour trouver la dernière
                closestPorte = filteredPortes[0];
                resultsDiv.innerHTML += '<p style="color: orange;">Vous avez dépassé toutes les portes dans ce sens. Affichage de la dernière porte disponible.</p>';
            }
        }

        // --- Affichage des résultats (inchangé) ---
        if (closestPorte) {
            const latitude = parseFloat(closestPorte.Latitude.trim());
            const longitude = parseFloat(closestPorte.Longitude.trim()); // Correction: plus d'espace à Longitude

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
            // Ce cas devrait être rare avec la nouvelle logique, mais on le garde pour la robustesse
            resultsDiv.innerHTML += '<p style="color: orange;">Aucune porte trouvée correspondant à vos critères.</p>';
        }
    });

    // Charger les données au démarrage de l'application
    loadPortesData();
});
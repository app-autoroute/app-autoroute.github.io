document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const themeToggle = document.getElementById('checkbox');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons');
    const pkInput = document.getElementById('pkInput');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resetButton = document.getElementById('resetButton');

    // NOUVEAU : Éléments du DOM pour les paramètres
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalButton = settingsModal.querySelector('.close-button');
    const autorouteCheckboxesContainer = document.getElementById('autorouteCheckboxes');
    const saveSettingsButton = document.getElementById('saveSettingsButton');

    let portesData = [];
    let selectedAutoroute = '';
    let selectedDirection = '';
    // NOUVEAU : Variable pour stocker les autoroutes favorites de l'utilisateur
    let favoriteAutoroutes = [];

    const LOCAL_STORAGE_PREFIX = 'autorouteApp_';
    const LAST_AUTOROUTE_KEY = LOCAL_STORAGE_PREFIX + 'lastAutoroute';
    const LAST_DIRECTION_KEY = LOCAL_STORAGE_PREFIX + 'lastDirection';
    const LAST_PK_KEY = LOCAL_STORAGE_PREFIX + 'lastPk';
    const THEME_KEY = LOCAL_STORAGE_PREFIX + 'theme';
    const FAVORITE_AUTOROUTES_KEY = LOCAL_STORAGE_PREFIX + 'favoriteAutoroutes'; // Nouvelle clé pour les favoris

    // --- Fonction utilitaire pour afficher les résultats ---
    function displayResults(content) {
        resultsDiv.innerHTML = content;
        resultsDiv.style.display = 'block'; // Rend le cadre visible
    }

    // --- Fonction utilitaire pour masquer les résultats ---
    function hideResults() {
        resultsDiv.innerHTML = ''; // Vide le contenu
        resultsDiv.style.display = 'none'; // Masque le cadre
    }

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

    // --- NOUVEAU : Gestion de la modale des paramètres ---
    function openSettingsModal() {
        settingsModal.style.display = 'flex'; // Utilise flex pour centrer
        generateAutorouteCheckboxes(); // Génère les checkboxes à l'ouverture
    }

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    // Génère les checkboxes des autoroutes dans la modale des paramètres
    function generateAutorouteCheckboxes() {
        autorouteCheckboxesContainer.innerHTML = ''; // Vide le conteneur avant de regénérer
        const allUniqueAutoroutes = [...new Set(portesData.map(porte => porte.Autoroute))].sort();

        allUniqueAutoroutes.forEach(autoroute => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = autoroute;
            // Vérifie si cette autoroute est dans les favorites sauvegardées
            checkbox.checked = favoriteAutoroutes.includes(autoroute);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(autoroute));
            autorouteCheckboxesContainer.appendChild(label);
        });
    }

    // Sauvegarde les autoroutes favorites sélectionnées dans le stockage local
    function saveFavoriteAutoroutes() {
        const checkboxes = autorouteCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
        const favoritesToSave = Array.from(checkboxes).map(cb => cb.value);
        localStorage.setItem(FAVORITE_AUTOROUTES_KEY, JSON.stringify(favoritesToSave));
        favoriteAutoroutes = favoritesToSave; // Met à jour la variable globale

        // Si aucune autoroute n'est sélectionnée, assurez-vous de toutes les afficher par défaut
        if (favoriteAutoroutes.length === 0) {
            favoriteAutoroutes = [...new Set(portesData.map(porte => porte.Autoroute))].sort();
            localStorage.setItem(FAVORITE_AUTOROUTES_KEY, JSON.stringify(favoriteAutoroutes)); // Sauvegarde toutes les autoroutes si aucune n'est choisie
        }
        
        // NOUVEAU : Désélectionne l'autoroute actuelle si elle n'est plus dans les favoris
        if (selectedAutoroute && !favoriteAutoroutes.includes(selectedAutoroute)) {
            selectedAutoroute = '';
            localStorage.removeItem(LAST_AUTOROUTE_KEY);
            selectedDirection = ''; // Réinitialise aussi la direction
            localStorage.removeItem(LAST_DIRECTION_KEY);
            // On ne touche pas au PK ici, il peut rester
        }

        populateAutorouteButtons(); // Met à jour les boutons sur la page principale avec les filtres
        updateDirectionButtons(); // Met à jour les boutons de direction
        hideResults(); // Cache les résultats si l'autoroute sélectionnée a changé
        closeSettingsModal(); // Ferme la modale après sauvegarde
    }

    // Charge les autoroutes favorites depuis le stockage local
    function loadFavoriteAutoroutes() {
        const storedFavorites = localStorage.getItem(FAVORITE_AUTOROUTES_KEY);
        if (storedFavorites) {
            favoriteAutoroutes = JSON.parse(storedFavorites);
        } else {
            // Si aucune préférence n'est enregistrée, toutes les autoroutes sont favorites par défaut
            favoriteAutoroutes = [...new Set(portesData.map(porte => porte.Autoroute))].sort();
        }
    }

    // --- Chargement des données des portes ---
    async function loadPortesData() {
        try {
            const response = await fetch('portes_autoroute.json');
            portesData = await response.json();
            portesData.forEach(porte => {
                porte.PK_Num = parseFloat(porte.PK.replace(',', '.'));
            });
            console.log('Données chargées et PK convertis :', portesData);
            loadFavoriteAutoroutes(); // Charge les préférences avant de peupler les boutons
            populateAutorouteButtons();
            loadLastSelections();
            hideResults(); // Masque les résultats au chargement initial
        } catch (error) {
            console.error('Erreur lors du chargement des données des portes :', error);
            displayResults('<h2>Erreur</h2><p style="color: red;">Impossible de charger les données des portes. Veuillez réessayer plus tard.</p>');
        }
    }

    // --- Fonction pour remplir les boutons d'autoroutes (MAJ pour filtrage et présélection) ---
    function populateAutorouteButtons() {
        // NOUVEAU : Utilise uniquement les autoroutes favorites
        const autoroutesToDisplay = favoriteAutoroutes.filter(aut => 
            [...new Set(portesData.map(p => p.Autoroute))].includes(aut)
        ).sort();

        autorouteButtonsContainer.innerHTML = '';

        if (autoroutesToDisplay.length === 0) {
            autorouteButtonsContainer.innerHTML = '<p>Aucune autoroute sélectionnée dans les paramètres.</p>';
            selectedAutoroute = ''; // Assurez-vous qu'aucune autoroute n'est sélectionnée
            localStorage.removeItem(LAST_AUTOROUTE_KEY);
            hideResults();
            return;
        }

        autoroutesToDisplay.forEach(autoroute => {
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
                hideResults();
            });
            autorouteButtonsContainer.appendChild(button);
        });

        // NOUVEAU LOGIQUE : Si une seule autoroute est disponible, la présélectionner
        if (autoroutesToDisplay.length === 1) {
            const singleAutoroute = autoroutesToDisplay[0];
            const singleAutorouteButton = document.querySelector(`.autoroute-button[data-autoroute="${singleAutoroute}"]`);
            if (singleAutorouteButton) {
                singleAutorouteButton.click(); // Simule le clic pour sélectionner et mettre à jour
            }
        } else {
            // Tente de resélectionner la dernière autoroute si elle est toujours dans les favoris affichés
            const lastAutoroute = localStorage.getItem(LAST_AUTOROUTE_KEY);
            if (lastAutoroute && autoroutesToDisplay.includes(lastAutoroute)) {
                const lastAutorouteButton = document.querySelector(`.autoroute-button[data-autoroute="${lastAutoroute}"]`);
                if (lastAutorouteButton) {
                    lastAutorouteButton.click(); // Simule le clic pour la sélection et la mise à jour des directions
                }
            } else {
                // Si la dernière autoroute n'est plus favorite, désélectionne et réinitialise
                selectedAutoroute = '';
                localStorage.removeItem(LAST_AUTOROUTE_KEY);
                updateDirectionButtons(); // Pour afficher le message "Veuillez sélectionner une autoroute d'abord."
            }
        }
    }

    // --- Fonction pour mettre à jour les boutons de direction (inchangée) ---
    function updateDirectionButtons() {
        directionButtonsContainer.innerHTML = '';
        selectedDirection = '';

        if (!selectedAutoroute) {
            directionButtonsContainer.innerHTML = '<p>Veuillez sélectionner une autoroute d\'abord.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
            hideResults();
            return;
        }

        const portesForSelectedAutoroute = portesData.filter(porte => porte.Autoroute === selectedAutoroute);
        const uniqueSens = [...new Set(portesForSelectedAutoroute.map(porte => porte.Sens))].sort();

        if (uniqueSens.length === 0) {
            directionButtonsContainer.innerHTML = '<p>Aucun sens disponible pour cette autoroute.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
            hideResults();
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
                hideResults();
            });
            directionButtonsContainer.appendChild(button);
        });

        const lastDirection = localStorage.getItem(LAST_DIRECTION_KEY);
        // NOUVEAU : Ne tente de présélectionner que si l'autoroute est la même que la dernière sélectionnée
        if (selectedAutoroute === localStorage.getItem(LAST_AUTOROUTE_KEY) && lastDirection && uniqueSens.includes(lastDirection)) {
            const lastDirectionButton = document.querySelector(`.direction-button[data-direction="${lastDirection}"]`);
            if (lastDirectionButton) {
                lastDirectionButton.click();
            }
        }
    }

    // --- Charger les dernières sélections au démarrage (MAJ pour gérer l'ordre) ---
    function loadLastSelections() {
        const lastPk = localStorage.getItem(LAST_PK_KEY);

        if (lastPk) {
            pkInput.value = lastPk;
        }
        
        // La sélection des autoroutes et directions est maintenant gérée par populateAutorouteButtons
        // et updateDirectionButtons au moment de leur rendu.
        // On relance la recherche si tous les champs sont remplis.
        setTimeout(() => {
            if (selectedAutoroute && selectedDirection && pkInput.value) {
                searchButton.click();
            } else {
                hideResults();
            }
        }, 150); // Petit délai pour s'assurer que les boutons sont bien cliqués avant la recherche
    }

    // --- Fonction de réinitialisation du formulaire (MAJ pour gérer les favoris) ---
    function resetForm() {
        selectedAutoroute = '';
        selectedDirection = '';
        pkInput.value = '';

        // Désélectionne les boutons visuellement
        document.querySelectorAll('.autoroute-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.direction-button').forEach(btn => btn.classList.remove('selected'));

        // Supprime les données de la dernière recherche du localStorage
        localStorage.removeItem(LAST_AUTOROUTE_KEY);
        localStorage.removeItem(LAST_DIRECTION_KEY);
        localStorage.removeItem(LAST_PK_KEY);
        
        // Recrée les boutons d'autoroute et de direction
        populateAutorouteButtons(); // Cela va recharger les favoris et désélectionner si besoin
        updateDirectionButtons(); // Cela va réafficher "Veuillez sélectionner une autoroute d'abord."

        hideResults(); // Masque complètement la section des résultats après réinitialisation
    }

    // --- Écouteur d'événement pour le bouton Réinitialiser (inchangé) ---
    resetButton.addEventListener('click', resetForm);

    // --- Écouteurs d'événements pour la modale des paramètres (NOUVEAU) ---
    settingsButton.addEventListener('click', openSettingsModal);
    closeModalButton.addEventListener('click', closeSettingsModal);
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });
    saveSettingsButton.addEventListener('click', saveFavoriteAutoroutes);

    // --- Fonction de recherche de la porte la plus proche (inchangée) ---
    searchButton.addEventListener('click', () => {
        const targetPk = parseFloat(pkInput.value.replace(',', '.'));

        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2>'; 
        resultsDiv.style.display = 'block'; 

        if (!isNaN(targetPk)) {
            localStorage.setItem(LAST_PK_KEY, pkInput.value);
        } else {
            localStorage.removeItem(LAST_PK_KEY);
        }

        if (isNaN(targetPk)) {
            displayResults('<h2>Résultats de la recherche</h2><p style="color: red;">Veuillez entrer un PK valide (un nombre).</p>');
            return;
        }

        if (!selectedAutoroute) {
            displayResults('<h2>Résultats de la recherche</h2><p style="color: red;">Veuillez sélectionner une autoroute.</p>');
            return;
        }

        if (!selectedDirection) {
            displayResults('<h2>Résultats de la recherche</h2><p style="color: red;">Veuillez sélectionner un sens de circulation.</p>');
            return;
        }

        const filteredPortes = portesData.filter(porte =>
            porte.Autoroute === selectedAutoroute &&
            porte.Sens === selectedDirection
        );

        if (filteredPortes.length === 0) {
            displayResults('<h2>Résultats de la recherche</h2><p style="color: orange;">Aucune porte trouvée pour l\'autoroute et le sens sélectionnés.</p>');
            return;
        }

        let closestAccess = null;
        let previousAccess = null;

        const progressionPK = filteredPortes[0] ? filteredPortes[0].ProgressionPK : null;

        if (!progressionPK) {
            displayResults('<h2>Résultats de la recherche</h2><p style="color: red;">Erreur: Information de progression PK manquante pour ce sens.</p>');
            return;
        }

        // --- DÉTERMINATION DE L'ACCÈS LE PLUS PROCHE ET DE L'ACCÈS PRÉCÉDENT ---
        if (progressionPK === "Ascendant") {
            filteredPortes.sort((a, b) => a.PK_Num - b.PK_Num);
            const accessiblePortes = filteredPortes.filter(porte => porte.PK_Num <= targetPk);

            if (accessiblePortes.length > 0) {
                closestAccess = accessiblePortes[accessiblePortes.length - 1];
                if (accessiblePortes.length >= 2) {
                    previousAccess = accessiblePortes[accessiblePortes.length - 2];
                }
            } else {
                displayResults('<h2>Résultats de la recherche</h2><p style="color: orange;">Vous n\'avez pas encore atteint la première porte dans ce sens. Affichage de la première porte disponible.</p>');
                return;
            }

        } else if (progressionPK === "Descendant") {
            filteredPortes.sort((a, b) => b.PK_Num - a.PK_Num);
            const accessiblePortes = filteredPortes.filter(porte => porte.PK_Num >= targetPk);

            if (accessiblePortes.length > 0) {
                closestAccess = accessiblePortes[accessiblePortes.length - 1];
                if (accessiblePortes.length >= 2) {
                    previousAccess = accessiblePortes[accessiblePortes.length - 2];
                }
            } else {
                displayResults('<h2>Résultats de la recherche</h2><p style="color: orange;">Vous n\'avez pas encore atteint la première porte dans ce sens. Affichage de la première porte disponible.</p>');
                return;
            }
        }

        // --- AFFICHAGE DES RÉSULTATS FINAUX ---
        if (closestAccess) {
            let htmlContent = '<h2>Résultats de la recherche</h2>'; 
            
            const distanceToClosest = Math.abs(targetPk - closestAccess.PK_Num);

            htmlContent += `
                <div class="result-item">
                    <h3>Accès le plus proche de l'intervention :</h3>
                    <p><strong>Autoroute :</strong> ${closestAccess.Autoroute}</p>
                    <p><strong>Sens :</strong> ${closestAccess.Sens}</p>
                    <p><strong>PK :</strong> ${closestAccess.PK}</p>
                    <p><strong>Type d'accès :</strong> ${closestAccess['Type d\'accès'] || 'Non spécifié'}</p>
                    <p><strong>Commentaires :</strong> ${closestAccess['Commentaires'] || 'Aucun'}</p>
                    <p><strong>Route d'accès :</strong> ${closestAccess['Route d\'accès'] || 'Non spécifié'}</p>
                    ${closestAccess.Photo && closestAccess.Photo !== 'à définir' ? `<p><a href="${closestAccess.Photo}" target="_blank">Voir la photo</a></p>` : ''}
                    <a href="https://www.google.com/maps/search/?api=1&query=${closestAccess.Latitude.trim()},${closestAccess.Longitude.trim()}" target="_blank" class="map-link">Ouvrir sur Google Maps</a>
            `;
            if (distanceToClosest < 0.3) {
                htmlContent += `<span class="proximity-alert">Cet accès est à moins de 300m de votre cible (${(distanceToClosest * 1000).toFixed(0)} m).</span>`;
            }
            htmlContent += `</div>`; 

            if (previousAccess) {
                htmlContent += `<hr>`; 

                htmlContent += `
                    <div class="result-item">
                        <h3>Accès précédent :</h3>
                        <p><strong>Autoroute :</strong> ${previousAccess.Autoroute}</p>
                        <p><strong>Sens :</strong> ${previousAccess.Sens}</p>
                        <p><strong>PK :</strong> ${previousAccess.PK}</p>
                        <p><strong>Type d'accès :</strong> ${previousAccess['Type d\'accès'] || 'Non spécifié'}</p>
                        <p><strong>Commentaires :</strong> ${previousAccess['Commentaires'] || 'Aucun'}</p>
                        <p><strong>Route d'accès :</strong> ${previousAccess['Route d\'accès'] || 'Non spécifié'}</p>
                        ${previousAccess.Photo && previousAccess.Photo !== 'à définir' ? `<p><a href="${previousAccess.Photo}" target="_blank">Voir la photo</a></p>` : ''}
                        <a href="https://www.google.com/maps/search/?api=1&query=${previousAccess.Latitude.trim()},${previousAccess.Longitude.trim()}" target="_blank" class="map-link">Ouvrir sur Google Maps</a>
                    </div>
                `;
            }
            displayResults(htmlContent); 
        } else {
            displayResults('<p style="color: orange;">Aucun accès trouvé correspondant à vos critères.</p>');
        }
    });

    // Charger les données au démarrage de l'application
    loadPortesData();
});
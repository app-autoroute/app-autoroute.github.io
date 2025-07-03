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

    // --- Chargement des données des portes ---
    async function loadPortesData() {
        try {
            const response = await fetch('portes_autoroute.json');
            portesData = await response.json();
            portesData.forEach(porte => {
                porte.PK_Num = parseFloat(porte.PK.replace(',', '.'));
            });
            console.log('Données chargées et PK convertis :', portesData);
            populateAutorouteButtons();
            loadLastSelections();
            hideResults(); // Masque les résultats au chargement initial
        } catch (error) {
            console.error('Erreur lors du chargement des données des portes :', error);
            // Affiche l'erreur si les données ne peuvent pas être chargées
            displayResults('<h2>Erreur</h2><p style="color: red;">Impossible de charger les données des portes. Veuillez réessayer plus tard.</p>');
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
                // NOUVEAU : Ne pas afficher de message ici, la section reste masquée
                hideResults();
            });
            autorouteButtonsContainer.appendChild(button);
        });
    }

    // --- Fonction pour mettre à jour les boutons de direction ---
    function updateDirectionButtons() {
        directionButtonsContainer.innerHTML = '';
        selectedDirection = '';

        if (!selectedAutoroute) {
            directionButtonsContainer.innerHTML = '<p>Veuillez sélectionner une autoroute d\'abord.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
            hideResults(); // NOUVEAU : S'assurer que le cadre est masqué
            return;
        }

        const portesForSelectedAutoroute = portesData.filter(porte => porte.Autoroute === selectedAutoroute);
        const uniqueSens = [...new Set(portesForSelectedAutoroute.map(porte => porte.Sens))].sort();


        if (uniqueSens.length === 0) {
            directionButtonsContainer.innerHTML = '<p>Aucun sens disponible pour cette autoroute.</p>';
            localStorage.removeItem(LAST_DIRECTION_KEY);
            // NOUVEAU : S'assurer que le cadre est masqué si pas de sens
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
                // NOUVEAU : Ne pas afficher de message ici, la section reste masquée
                hideResults();
            });
            directionButtonsContainer.appendChild(button);
        });

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

        // Si une recherche complète peut être lancée au démarrage, on la lance.
        // C'est le bouton de recherche qui rendra la div visible.
        setTimeout(() => {
            if (selectedAutoroute && selectedDirection && pkInput.value) {
                searchButton.click();
            } else {
                // NOUVEAU : Si pas de recherche automatique, on s'assure que le cadre reste masqué
                hideResults();
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
        hideResults(); // Masque complètement la section des résultats après réinitialisation
    }

    // --- Écouteur d'événement pour le bouton Réinitialiser ---
    resetButton.addEventListener('click', resetForm);

    // --- Fonction de recherche de la porte la plus proche ---
    searchButton.addEventListener('click', () => {
        const targetPk = parseFloat(pkInput.value.replace(',', '.'));

        // Chaque fois que le bouton de recherche est cliqué, on réinitialise et prépare l'affichage
        resultsDiv.innerHTML = '<h2>Résultats de la recherche</h2>'; // Toujours afficher ce titre avant les messages d'erreur ou les résultats
        resultsDiv.style.display = 'block'; // Assurez-vous qu'elle est visible pour afficher les messages/résultats

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
            let htmlContent = '<h2>Résultats de la recherche</h2>'; // Inclure le titre ici
            
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
            htmlContent += `</div>`; // Fermeture du result-item

            // Ajout du trait horizontal si l'accès précédent existe
            if (previousAccess) {
                htmlContent += `<hr>`; // Le style est maintenant dans style.css

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
            displayResults(htmlContent); // Utilise la fonction displayResults
        } else {
            // Ce cas devrait être rare si les retours précédents sont gérés par 'return'
            displayResults('<p style="color: orange;">Aucun accès trouvé correspondant à vos critères.</p>');
        }
    });

    // Charger les données au démarrage de l'application
    loadPortesData();
});
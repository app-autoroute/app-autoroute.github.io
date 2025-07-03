document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const pkInput = document.getElementById('pkInput');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resetButton = document.getElementById('resetButton');
    const themeSwitch = document.getElementById('checkbox');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalButton = settingsModal.querySelector('.close-button');
    const autorouteCheckboxesContainer = document.getElementById('autorouteCheckboxes');
    const saveSettingsButton = document.getElementById('saveSettingsButton');

    // Déclaration des autoroutes et sens (ajoutez toutes les autoroutes nécessaires ici)
    const allAutoroutes = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A13', 'A16', 'A19', 'A20', 'A21', 'A25', 'A26', 'A28', 'A29', 'A31', 'A34', 'A35', 'A36', 'A39', 'A40', 'A41', 'A42', 'A43', 'A46', 'A47', 'A48', 'A49', 'A50', 'A51', 'A52', 'A54', 'A55', 'A57', 'A61', 'A62', 'A63', 'A64', 'A65', 'A66', 'A68', 'A71', 'A72', 'A75', 'A77', 'A79', 'A81', 'A82', 'A83', 'A84', 'A85', 'A86', 'A87', 'A88', 'A89'];
    const directions = ['Nord', 'Sud', 'Est', 'Ouest']; // Directions générales

    let selectedAutoroute = null;
    let selectedDirection = null;

    // --- Gestion du thème Jour/Nuit ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'light-mode') {
            themeSwitch.checked = true;
        }
    }

    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
    });

    // --- Fonctions de gestion de la modale des paramètres ---
    function openSettingsModal() {
        settingsModal.style.display = 'flex'; // Utilise flex pour centrer
        generateAutorouteCheckboxes(); // Génère les checkboxes à l'ouverture
    }

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    // Génère les checkboxes des autoroutes dans la modale
    function generateAutorouteCheckboxes() {
        autorouteCheckboxesContainer.innerHTML = ''; // Vide le conteneur avant de regénérer
        const savedFavorites = getFavoriteAutoroutes();

        allAutoroutes.forEach(autoroute => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = autoroute;
            checkbox.checked = savedFavorites.includes(autoroute); // Coche si elle est favorite

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(autoroute));
            autorouteCheckboxesContainer.appendChild(label);
        });
    }

    // Récupère les autoroutes favorites du stockage local
    function getFavoriteAutoroutes() {
        const favorites = localStorage.getItem('favoriteAutoroutes');
        return favorites ? JSON.parse(favorites) : allAutoroutes; // Par défaut, toutes sont favorites
    }

    // Sauvegarde les autoroutes favorites dans le stockage local
    function saveFavoriteAutoroutes() {
        const checkboxes = autorouteCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
        const favoritesToSave = Array.from(checkboxes).map(cb => cb.value);
        localStorage.setItem('favoriteAutoroutes', JSON.stringify(favoritesToSave));
        renderAutorouteButtons(); // Met à jour les boutons sur la page principale
        closeSettingsModal(); // Ferme la modale après sauvegarde
    }

    // --- Fonctions de rendu des boutons Autoroute et Direction ---
    function renderAutorouteButtons() {
        autorouteButtonsContainer.innerHTML = ''; // Vide le conteneur
        const favorites = getFavoriteAutoroutes(); // Récupère les autoroutes favorites
        const autoroutesToDisplay = favorites.length > 0 ? favorites : allAutoroutes; // Affiche favorites, sinon toutes

        autoroutesToDisplay.forEach(autoroute => {
            const button = document.createElement('button');
            button.classList.add('autoroute-button');
            button.textContent = autoroute;
            button.dataset.autoroute = autoroute;
            if (autoroute === selectedAutoroute) {
                button.classList.add('selected');
            }
            button.addEventListener('click', () => {
                selectAutoroute(autoroute);
            });
            autorouteButtonsContainer.appendChild(button);
        });
    }

    function renderDirectionButtons() {
        directionButtonsContainer.innerHTML = ''; // Vide le conteneur
        directions.forEach(direction => {
            const button = document.createElement('button');
            button.classList.add('direction-button');
            button.textContent = direction;
            button.dataset.direction = direction;
            if (direction === selectedDirection) {
                button.classList.add('selected');
            }
            button.addEventListener('click', () => {
                selectDirection(direction);
            });
            directionButtonsContainer.appendChild(button);
        });
    }

    // --- Fonctions de sélection des boutons ---
    function selectAutoroute(autoroute) {
        selectedAutoroute = autoroute;
        renderAutorouteButtons(); // Re-render pour mettre à jour la sélection
    }

    function selectDirection(direction) {
        selectedDirection = direction;
        renderDirectionButtons(); // Re-render pour mettre à jour la sélection
    }

    // --- Fonction de réinitialisation ---
    function resetForm() {
        pkInput.value = '';
        selectedAutoroute = null;
        selectedDirection = null;
        resultsDiv.style.display = 'none'; // Masquer les résultats
        resultsDiv.innerHTML = ''; // Vider les résultats
        renderAutorouteButtons(); // Réinitialiser l'affichage des boutons
        renderDirectionButtons(); // Réinitialiser l'affichage des boutons
    }

    // --- Fonction de recherche (Logique Simplifiée) ---
    searchButton.addEventListener('click', () => {
        const pk = parseFloat(pkInput.value);

        // Vérification des champs
        if (!selectedAutoroute) {
            resultsDiv.innerHTML = '<p style="color: red;">Veuillez sélectionner une autoroute.</p>';
            resultsDiv.style.display = 'block';
            return;
        }
        if (!selectedDirection) {
            resultsDiv.innerHTML = '<p style="color: red;">Veuillez sélectionner un sens de circulation.</p>';
            resultsDiv.style.display = 'block';
            return;
        }
        if (isNaN(pk) || pk <= 0) {
            resultsDiv.innerHTML = '<p style="color: red;">Veuillez saisir un Point Kilométrique (PK) valide.</p>';
            resultsDiv.style.display = 'block';
            return;
        }

        // Simulez une recherche et affichez un résultat
        let resultMessage = `<h2>Résultat de la recherche</h2>
                             <p><strong>Autoroute:</strong> ${selectedAutoroute}</p>
                             <p><strong>Sens:</strong> ${selectedDirection}</p>
                             <p><strong>PK Saisi:</strong> ${pk.toFixed(2)}</p>`;

        // Exemple de logique de proximité (vous pouvez l'affiner)
        // Si le PK est "proche" d'un PK connu, ajouter une alerte
        if (pk > 120 && pk < 130 && selectedAutoroute === 'A6') { // Exemple pour l'A6
             resultMessage += `<p class="proximity-alert">Attention : Vous êtes proche de la sortie X ou Y sur l'A6 !</p>`;
        } else if (pk > 200 && pk < 210 && selectedAutoroute === 'A10') { // Exemple pour l'A10
             resultMessage += `<p class="proximity-alert">Accès potentiel à une aire de repos importante sur l'A10.</p>`;
        }


        // Lien vers Google Maps (exemple générique, à adapter avec des coordonnées réelles si possible)
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${selectedAutoroute}+PK+${pk}+${selectedDirection}`;
        resultMessage += `<a href="${mapLink}" target="_blank" class="map-link">Voir sur Google Maps</a>`;

        resultsDiv.innerHTML = resultMessage;
        resultsDiv.style.display = 'block';
    });

    // --- Écouteurs d'événements ---
    resetButton.addEventListener('click', resetForm);
    settingsButton.addEventListener('click', openSettingsModal);
    closeModalButton.addEventListener('click', closeSettingsModal);
    // Fermer la modale si l'utilisateur clique en dehors du contenu
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });
    saveSettingsButton.addEventListener('click', saveFavoriteAutoroutes);

    // Initialisation
    renderAutorouteButtons(); // Affiche les boutons d'autoroute au chargement (selon les favoris)
    renderDirectionButtons(); // Affiche les boutons de direction
});
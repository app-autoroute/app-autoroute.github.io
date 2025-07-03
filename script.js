document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const pkInput = document.getElementById('pkInput');
    const autorouteButtonsContainer = document.getElementById('autorouteButtons');
    const directionButtonsContainer = document.getElementById('directionButtons');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resetButton = document.getElementById('resetButton');
    const themeSwitch = document.getElementById('checkbox');
    const settingsButton = document.getElementById('settingsButton'); // Ce bouton est toujours présent dans l'HTML, mais sans fonction ici

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

    // --- Fonctions de rendu des boutons Autoroute et Direction ---
    function renderAutorouteButtons() {
        autorouteButtonsContainer.innerHTML = ''; // Vide le conteneur
        allAutoroutes.forEach(autoroute => { // Affiche TOUTES les autoroutes
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
    // Note: settingsButton n'aura pas d'écouteur d'événements ici et ne fera rien au clic.
    // Les écouteurs pour la modale et les checkboxes de la modale sont retirés.

    // Initialisation
    renderAutorouteButtons(); // Affiche tous les boutons d'autoroute
    renderDirectionButtons(); // Affiche les boutons de direction
});
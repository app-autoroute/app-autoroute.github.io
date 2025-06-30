document.addEventListener('DOMContentLoaded', () => {
    // Sélection des éléments HTML
    const pkInput = document.getElementById('pkInput');
    const directionButtons = document.querySelectorAll('.direction-button'); // Maintenant des boutons
    let selectedDirection = directionButtons[0].dataset.direction; // Initialise avec le premier sens par défaut
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const resultMessage = document.getElementById('resultMessage');

    let portesData = []; // Pour stocker les données des portes

    // Fonction pour afficher des messages
    function displayMessage(message, type = "info") {
        resultMessage.textContent = message;
        // Les couleurs sont maintenant gérées par CSS variables et classes de thème pour une meilleure cohérence
        // Cependant, pour les messages d'erreur/orange spécifiques, on peut encore les forcer si besoin
        if (type === "error") {
            resultMessage.style.color = "red";
        } else if (type === "orange") {
            resultMessage.style.color = "orange";
        } else {
            // Remet la couleur par défaut définie par le thème via CSS
            resultMessage.style.color = ''; // Vide le style inline pour que le CSS prenne le relais
        }
        resultsDiv.style.display = "block"; // S'assurer que la section des résultats est visible
    }

    // Chargement des données JSON des portes
    fetch('portes_autoroute.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            portesData = data;
            displayMessage("Données des portes chargées. Entrez un PK et un sens pour rechercher.");
        })
        .catch(error => {
            console.error("Erreur lors du chargement des données des portes:", error);
            displayMessage("Erreur lors du chargement des données des portes: " + error.message, "error");
        });

    // Logique de recherche de la porte
    function searchPorte() {
        const pkValue = pkInput.value.trim();

        if (!pkValue) {
            displayMessage("Veuillez entrer un PK autoroute.", "orange");
            return;
        }

        const targetPk = parseFloat(pkValue.replace(',', '.')); // Convertir PK en nombre, gérer la virgule

        if (isNaN(targetPk)) {
            displayMessage("Veuillez entrer un PK valide (un nombre).", "error");
            return;
        }

        if (!selectedDirection) {
            displayMessage("Veuillez sélectionner un sens de circulation.", "orange");
            return;
        }

        const filteredPortes = portesData.filter(porte => porte.Sens === selectedDirection);

        if (filteredPortes.length === 0) {
            displayMessage(`Aucune porte trouvée pour le sens "${selectedDirection}".`, "orange");
            return;
        }

        let bestPorte = null;
        let minDiff = Infinity; // Différence minimale avec le PK cible

        const isPkIncreasing = selectedDirection.includes("Paris→Boulogne");
        const isPkDecreasing = selectedDirection.includes("Boulogne - Paris");

        let foundInDirection = false;

        for (const porte of filteredPortes) {
            const portePk = parseFloat(String(porte.PK).replace(',', '.'));
            let diff = Infinity;

            if (isPkIncreasing && portePk >= targetPk) {
                diff = portePk - targetPk;
            } else if (isPkDecreasing && portePk <= targetPk) {
                diff = targetPk - portePk;
            }

            if (diff < minDiff) {
                minDiff = diff;
                bestPorte = porte;
                foundInDirection = true;
            }
        }

        if (!foundInDirection && filteredPortes.length > 0) {
            minDiff = Infinity;
            bestPorte = filteredPortes.reduce((prev, curr) => {
                const prevPk = parseFloat(String(prev.PK).replace(',', '.'));
                const currPk = parseFloat(String(curr.PK).replace(',', '.'));
                return (Math.abs(currPk - targetPk) < Math.abs(prevPk - targetPk) ? curr : prev);
            });
            displayMessage("Aucune porte trouvée en amont dans ce sens. Affichage de la porte la plus proche :", "orange");
        }

        if (bestPorte) {
            let detailsHtml = `
                <h2>Détails de la porte la plus proche</h2>
                <div class="result-item"><strong>PK:</strong> ${bestPorte.PK}</div>
                <div class="result-item"><strong>Nom:</strong> ${bestPorte.Nom || 'Non spécifié'}</div>
                <div class="result-item"><strong>Autoroute:</strong> ${bestPorte.Autoroute || 'Non spécifiée'}</div>
                <div class="result-item"><strong>Sens:</strong> ${bestPorte.Sens || 'Non spécifié'}</div>
                <div class="result-item"><strong>Type d'accès:</strong> ${bestPorte['Type d\'accès'] || 'Non spécifié'}</div>
                <div class="result-item"><strong>Route d'accès:</strong> ${bestPorte['Route d\'accès'] || 'Non spécifiée'}</div>
            `;

            if (bestPorte.Latitude && bestPorte.Longitude) {
                // Utilisation de la syntaxe correcte pour Google Maps
                const mapLink = `https://www.google.com/maps/search/?api=1&query=${bestPorte.Latitude},${bestPorte.Longitude}`;
                detailsHtml += `<a href="${mapLink}" target="_blank" class="map-link">Voir sur Google Maps</a>`;
            } else {
                detailsHtml += `<p style="color: orange; font-size: 0.9em;">Coordonnées GPS non disponibles pour cette porte.</p>`;
            }

            resultsDiv.innerHTML = detailsHtml;
            resultsDiv.style.display = "block";
        } else {
            displayMessage("Aucune porte trouvée correspondant à vos critères.", "orange");
        }
    }

    // Écouteur d'événement pour le bouton de recherche
    searchButton.addEventListener('click', searchPorte);

    // Écouteur d'événement pour la touche 'Entrée' dans le champ PK
    pkInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchPorte();
        }
    });

    // Logique pour les boutons de direction
    directionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Supprime la classe 'selected' de tous les boutons
            directionButtons.forEach(btn => btn.classList.remove('selected'));

            // Ajoute la classe 'selected' au bouton cliqué
            button.classList.add('selected');

            // Met à jour la variable globale selectedDirection
            selectedDirection = button.dataset.direction;
        });
    });

    // Appliquer la sélection initiale au premier bouton au chargement
    if (directionButtons.length > 0) {
        directionButtons[0].classList.add('selected');
    }

    // =========================================================
    // LOGIQUE DU SÉLECTEUR DE THÈME JOUR/NUIT
    // =========================================================

    const themeToggle = document.getElementById('checkbox');
    const themeText = document.querySelector('.theme-switch-wrapper em');

    // Fonction pour appliquer le thème
    function applyTheme(isLightMode) {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            themeText.textContent = 'Mode Jour';
        } else {
            document.body.classList.remove('light-mode');
            themeText.textContent = 'Mode Nuit';
        }
        // Gérer la couleur du texte du switch basé sur le thème
        // Ceci est géré par les variables CSS, donc pas besoin de le forcer ici
    }

    // Vérifier la préférence de l'utilisateur au chargement de la page
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        themeToggle.checked = true;
        applyTheme(true);
    } else {
        themeToggle.checked = false;
        applyTheme(false);
    }

    // Écouter les changements sur l'interrupteur
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            applyTheme(true);
            localStorage.setItem('theme', 'light');
        } else {
            applyTheme(false);
            localStorage.setItem('theme', 'dark');
        }
    });
});
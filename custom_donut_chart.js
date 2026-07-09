looker.plugins.visualizations.add({
  // 1. Charger la dépendance Highcharts via CDN
  dependencies: [
   "https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.4.1/highcharts.js"
  ],

  // 2. Initialiser le conteneur HTML
  create: function(element, config) {
    element.innerHTML = `
      <style>
        #highcharts-donut-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="highcharts-donut-container"></div>
    `;
  },

  // 3. Mettre à jour le graphique avec les données de Looker
  updateAsync: function(data, element, config, queryResponse, details, done) {
    
    // Protection : Vérifier qu'on a bien au moins 1 dimension et 1 mesure
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;
    
    if (dimensions.length === 0 || measures.length === 0) {
      this.addError({
        title: "Données insuffisantes", 
        message: "Cette visualisation nécessite au moins une Dimension (ex: Catégorie) et une Mesure (ex: Total)."
      });
      return done();
    } else {
      this.clearErrors();
    }

    // Récupérer le nom technique des champs Looker
    const dimensionName = dimensions[0].name;
    const measureName = measures[0].name;
    const measureLabel = measures[0].label_short || measures[0].label;

    // 4. Transformation des données Looker au format Highcharts [['Nom', Valeur], ...]
    const highchartsData = data.map(row => {
      return [
        row[dimensionName].value, // Le nom (ex: 'Health care')
        row[measureName].value    // La valeur (ex: 34)
      ];
    });

    // 5. Rendu de votre modèle Highcharts
    Highcharts.chart('highcharts-donut-container', {
      chart: {
        type: 'pie'
      },

      title: {
        text: measureLabel // Titre dynamique basé sur la mesure de Looker
      },

      tooltip: {
        valueSuffix: ''
      },

series: [
        {
          name: measureLabel,
          borderRadius: 8,     // Vos coins arrondis
          borderWidth: 3,
          innerSize: '70%',    // Effet Donut
          dataLabels: [
            {
              // ÉTIQUETTES EXTÉRIEURES (Noms des pays)
              enabled: true,
              format: '{point.name}',
              distance: 15
            },
            {
              // ÉTIQUETTES INTÉRIEURES (Pourcentages)
              enabled: true,
              format: '{point.percentage:.0f}%',
              distance: '-25%', // Un peu plus au centre de la part
              style: {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#FFFFFF', // Écrit en blanc brillant
                textOutline: '1px solid rgba(0,0,0,0.4)' // Ombre légère pour lisibilité sans rectangle noir
              }
            }
          ],
          data: highchartsData // Vos données dynamiques Looker infusées ici
        }
      ]
    });

    // 6. Toujours signaler à Looker que le rendu est terminé
    done();
  }
});

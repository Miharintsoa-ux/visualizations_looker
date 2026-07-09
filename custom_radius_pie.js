looker.plugins.visualizations.add({
  // 1. Charger Highcharts ET le module spécifique Variable Pie
  dependencies: [
   "https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.4.1/highcharts.js",
    "https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.4.1/modules/variable-pie.min.js"
  ],

  // 2. Initialiser le conteneur HTML
  create: function(element, config) {
    element.innerHTML = `
      <style>
        #highcharts-variablepie-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="highcharts-variablepie-container"></div>
    `;
  },

  // 3. Mettre à jour le graphique avec les données Looker
  updateAsync: function(data, element, config, queryResponse, details, done) {
    
    // Protection : On a besoin d'au moins 1 dimension et 2 mesures
    const dimensions = queryResponse.fields.dimensions;
    const measures = queryResponse.fields.measures;
    
    if (dimensions.length < 1 || measures.length < 2) {
      this.addError({
        title: "Données insuffisantes", 
        message: "Ce graphique nécessite 1 Dimension (ex: Pays) et au moins 2 Mesures (la 1ère pour la largeur du secteur [Y], la 2ème pour le rayon [Z])."
      });
      return done();
    } else {
      this.clearErrors();
    }

    // Récupérer le nom technique des colonnes Looker
    const dimName = dimensions[0].name;
    const measureYName = measures[0].name; // Première mesure (ex: Area)
    const measureZName = measures[1].name; // Deuxième mesure (ex: Density)

    // Récupérer les labels propres pour le titre et les tooltips
    const dimLabel = dimensions[0].label_short || dimensions[0].label;
    const measureYLabel = measures[0].label_short || measures[0].label;
    const measureZLabel = measures[1].label_short || measures[1].label;

    // 4. Transformation des données au format attendu par le 'variablepie' [{name, y, z}]
    const highchartsData = data.map(row => {
      return {
        name: row[dimName].value,
        y: row[measureYName].value,
        z: row[measureZName].value
      };
    });

    // 5. Rendu du graphique Variable Pie
    Highcharts.chart('highcharts-variablepie-container', {
      chart: {
        type: 'variablepie'
      },
      
      // Titre généré dynamiquement selon vos données Looker
      title: {
        text: `${dimLabel} comparés par ${measureYLabel} et ${measureZLabel}`
      },

      // Infobulle dynamique avec les labels Looker
      tooltip: {
        headerFormat: '',
        pointFormat: `<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b><br/>` +
                     `${measureYLabel} : <b>{point.y}</b><br/>` +
                     `${measureZLabel} : <b>{point.z}</b><br/>`
      },

      series: [{
        minPointSize: 10,
        innerSize: '20%',
        zMin: 0,
        name: dimLabel.toLowerCase(),
        borderRadius: 5,
        data: highchartsData, // Vos données Looker injectées ici
        colors: [
          '#4caefe',
          '#3dc3e8',
          '#2dd9db',
          '#1feeaf',
          '#0ff3a0',
          '#00e887',
          '#23e274'
        ]
      }]
    });

    // 6. Finaliser le rendu
    done();
  }
});

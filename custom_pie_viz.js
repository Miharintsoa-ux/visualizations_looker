looker.plugins.visualizations.add({
  // Options de configuration affichées dans le panneau de droite de Looker
  options: {
    chartTitle: {
      type: "string",
      label: "Titre du graphique",
      default: "Comparaison Variable Pie"
    },
    innerSize: {
      type: "string",
      label: "Taille de l'ouverture centrale (Donut %)",
      default: "20%"
    }
  },

  // Fonction principale appelée lors de la création ou mise à jour du graphique
  updateLarge: function(data, element, config, queryResponse, details) {
    this.clearErrors();

    // 1. Validation des données Looker
    // Il faut au moins 1 dimension (ex: Pays) et 2 mesures (ex: Superficie, Densité)
    if (queryResponse.fields.dimensions.length < 1 || queryResponse.fields.measures.length < 2) {
      this.addError({
        group: "data-requirements",
        title: "Données insuffisantes",
        message: "Cette visualisation requiert au moins 1 Dimension (ex: Nom) et exactement 2 Mesures (1ère pour l'angle Y, 2ème pour le rayon Z)."
      });
      return;
    }

    const dimensionKey = queryResponse.fields.dimensions[0].name;
    const measureYKey = queryResponse.fields.measures[0].name; // Détermine l'angle
    const measureZKey = queryResponse.fields.measures[1].name; // Détermine le rayon

    const measureYLabel = queryResponse.fields.measures[0].label_short || queryResponse.fields.measures[0].label;
    const measureZLabel = queryResponse.fields.measures[1].label_short || queryResponse.fields.measures[1].label;

    // 2. Transformation des données Looker au format Highcharts
    const chartData = data.map(row => {
      return {
        name: LookerCharts.Utils.htmlForCell(row[dimensionKey]),
        y: row[measureYKey].value,
        z: row[measureZKey].value
      };
    });

    // 3. Injection des scripts Highcharts si non présents
    if (typeof Highcharts === 'undefined') {
      const hcScript = document.createElement('script');
      hcScript.src = 'https://code.highcharts.com/highcharts.js';
      hcScript.onload = () => this.loadVariablePieModule(element, config, chartData, measureYLabel, measureZLabel);
      document.head.appendChild(hcScript);
    } else if (typeof Highcharts.seriesTypes.variablepie === 'undefined') {
      this.loadVariablePieModule(element, config, chartData, measureYLabel, measureZLabel);
    } else {
      this.renderChart(element, config, chartData, measureYLabel, measureZLabel);
    }
  },

  // Charger le module requis pour le Variable Pie
  loadVariablePieModule: function(element, config, chartData, measureYLabel, measureZLabel) {
    const vpScript = document.createElement('script');
    vpScript.src = 'https://code.highcharts.com/modules/variable-pie.js';
    vpScript.onload = () => this.renderChart(element, config, chartData, measureYLabel, measureZLabel);
    document.head.appendChild(vpScript);
  },

  // Rendu effectif du graphique Highcharts dans l'élément Looker
  renderChart: function(element, config, chartData, measureYLabel, measureZLabel) {
    // Créer un conteneur unique si nécessaire
    let container = element.querySelector('#highcharts-target');
    if (!container) {
      container = document.createElement('div');
      container.id = 'highcharts-target';
      container.style.width = '100%';
      container.style.height = '100%';
      element.appendChild(container);
    }

    Highcharts.chart(container, {
      chart: {
        type: 'variablepie'
      },
      title: {
        text: config.chartTitle || 'Visualisation personnalisée'
      },
      tooltip: {
        headerFormat: '',
        pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b><br/>' +
          measureYLabel + ' (Angle/Y): <b>{point.y}</b><br/>' +
          measureZLabel + ' (Rayon/Z): <b>{point.z}</b><br/>'
      },
      series: [{
        minPointSize: 10,
        innerSize: config.innerSize || '20%',
        zMin: 0,
        borderRadius: 5,
        data: chartData,
        colors: [
          '#4caefe', '#3dc3e8', '#2dd9db', '#1feeaf', 
          '#0ff3a0', '#00e887', '#23e274'
        ]
      }]
    });
  }
});

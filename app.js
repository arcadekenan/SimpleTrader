var app = angular.module("index", ["ngRoute", "ngSQLite", "chart.js"]);

  app.constant('DB_CONFIG', {
      dados: {
          id: 'key',
          date: { type: 'text', null: false },
          high: { type: 'real', null: false },
          low: { type: 'real', null: false },
          vol: { type: 'real', null: false },
          last: { type: 'real', null: false },
          buy: { type: 'real', null: false },
          sell: { type: 'real', null: false },
      }
  })

  app.run(function ($SQLite) {
      $SQLite.dbConfig({
          name: 'simple-trader-db',
          description: 'Test DB',
          version: '1.0'
      });
  })

  app.run(function ($SQLite, DB_CONFIG) {
      $SQLite.init(function (init) {
          angular.forEach(DB_CONFIG, function (config, name) {
              init.step();
              $SQLite.createTable(name, config).then(init.done);
          });
          init.finish();
      });
  });

  app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
      templateUrl : "templates/main.html",
      controllerUrl : "mainController"
    })
//    .otherwise({
//      templateUrl : "app/template/main.htm"
//    });
  });

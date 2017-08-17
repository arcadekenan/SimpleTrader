var app = angular.module("index", ["ngRoute", "ngSQLite", "chart.js", "angular-hmac-sha512", "firebase"]);

  app.constant('DB_CONFIG', {
      usrcarteira: {
          id: 'key',
          tapi_id: { type: 'text', null: false },
          secret: { type: 'text', null: false },
          status: { type: 'real', null: false },
      }
  })

  app.run(function ($SQLite) {
      $SQLite.dbConfig({
          name: 'simple-trader-db',
          description: 'AppLocal DB',
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
  });

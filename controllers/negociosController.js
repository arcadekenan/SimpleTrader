app.controller("negociosController", function ($scope, $rootScope, $http, $SQLite, $timeout, $filter, $crypthmac, $route) {

  $scope.login = function () {
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    var url = "/tapi/v3/?tapi_method=get_account_info&tapi_nonce="+tapi_nonce;
    var encrypttext = $crypthmac.encrypt(url, $scope.secret);
    console.log(encrypttext);

    $http({
      method: 'POST',
      url: 'https://www.mercadobitcoin.net/tapi/v3/',
      headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'TAPI-ID' : $scope.tapiID,
      'TAPI-MAC' : encrypttext
      },
      transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
      },
      data:{
        "tapi_method" : "get_account_info",
        "tapi_nonce" : tapi_nonce,
      }
    }).then(function successCallback(response) {
        console.log(response);
        var novoDado = {};
        novoDado["tapi_id"] = $scope.tapiID;
        novoDado["secret"] = $scope.secret;
        novoDado["status"] = 0;
        $SQLite.ready(function () {
           this.insert('USRCARTEIRA', novoDado)
               .then(function () {
                        console.log('Conectado Com Sucesso');
                        $route.reload();
                    },
                     function () { console.err('Error!');}
               );
        });
        return true;
    })
  };

  $scope.logoff = function(){
    $SQLite.ready(function () {
    this.execute('DELETE FROM USRCARTEIRA WHERE ROWID = 1')
      .then(function () {
              console.log('Desconectado Com Sucesso');
              $route.reload();
            },
            function () { console.err('Error!'); }
      );
    });
  }
});

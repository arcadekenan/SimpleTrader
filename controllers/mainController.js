app.controller("mainController", function ($scope, $rootScope, $crypthmac, $http, $SQLite, $timeout, $filter, $route) {

  var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  var pjson = require('./package.json');
  var onlineStart = navigator.onLine;
  $scope.versaoST = pjson.version;
  $scope.tickInicial = 3000;
  $scope.tickExecucao = 61000;
  $scope.loading = true;
  $scope.useronLTC = false;
  $scope.useronBTC = false;
  $scope.logado = false;
  $scope.modalLogin = "modal-logar"
  $scope.tab1 = true;
  $scope.tab2 = false;
  $scope.tab3 = false;
  $scope.tab4 = false;
  $scope.table1 = true;
  $scope.table2 = false;
  $scope.tableTabAct1 = "tabs-select-ativo";
  $scope.tableTabAct2 = "";
  $scope.flagLTC = "BRLLTC"
  $scope.flagBTC = "BRLBTC";
  $scope.compraMDLTC = true;
  $scope.compraMDBTC = false;

  if (!onlineStart) {
    $scope.loading = false;
    $('#modalOnline').modal('open', {dismissible: false});
    setTimeout(function () {
      $('#modalOnline').modal('close');
      $route.reload();
    }, 60000);
  }

  $scope.login = function () {
    $scope.tapiIDInp = document.getElementById('user').value;
    $scope.secretInp = document.getElementById('password').value;
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    var url = "/tapi/v3/?tapi_method=get_account_info&tapi_nonce="+tapi_nonce;
    var encrypttext = $crypthmac.encrypt(url, $scope.secretInp);
    console.log(encrypttext);

    $http({
      method: 'POST',
      url: 'https://www.mercadobitcoin.net/tapi/v3/',
      headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'TAPI-ID' : $scope.tapiIDInp,
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
        novoDado["tapi_id"] = $scope.tapiIDInp;
        novoDado["secret"] = $scope.secretInp;
        novoDado["status"] = 0;
        $SQLite.ready(function () {
           this.insert('USRCARTEIRA', novoDado)
               .then(function () {
                        console.log('Conectado Com Sucesso');
                        $('#modal2').modal('close');
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
    this.execute('DELETE FROM USRCARTEIRA')
      .then(function () {
              console.log('Desconectado Com Sucesso');
              $('#modal2').modal('close');
              $route.reload();
            },
            function () { console.err('Error!'); }
      );
    });
  }

  $SQLite.ready(function () {
      this
          .select('SELECT TAPI_ID, SECRET FROM USRCARTEIRA WHERE STATUS = 0')
          .then(
      function () { console.log('Sem Usuário Registrado'); },
      function () { console.err('Error!'); },
      function (data) {
        $scope.tapiID = data.item.tapi_id;
        $scope.secret = data.item.secret;
        $scope.logado = true;
        $scope.modalLogin = "modal-logado"
        console.log($scope.tapiID);
        $scope.usrInfo();
        $scope.ordemInfoLTC();
        $scope.ordemInfoBTC();
        console.log(data);
      }
    );
  });

  $scope.usrInfo = function () {
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    var url = "/tapi/v3/?tapi_method=get_account_info&tapi_nonce="+tapi_nonce;
    console.log($scope.tapiID);
    var encrypttext = $crypthmac.encrypt(url, $scope.secret);
    console.log(encrypttext);

    $http({
      method: 'POST',
      url: 'https://www.mercadobitcoin.net/tapi/v3/',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'TAPI-ID' : $scope.tapiID, 'TAPI-MAC' : encrypttext},
      transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
      },
      data:{"tapi_method" : "get_account_info", "tapi_nonce" : tapi_nonce,}
    }).then(function successCallback(response) {
      var date = new Date(response.data.server_unix_timestamp*1000);
      $scope.dataAtualizacaoUserInfo = "Atualizado em: "+
                                  nomeMeses[date.getMonth()]+" "+
                                  date.getDate()+", "+
                                  date.getHours()+":"+
                                  date.getMinutes();
      $scope.qtdRSUser = response.data.response_data.balance.brl.available;
      $scope.qtdLTCUser = response.data.response_data.balance.ltc.available;
      $scope.mostraQtdLTCUser = "LTC "+$scope.qtdLTCUser;
      $scope.qtdBTCUser = response.data.response_data.balance.btc.available;
      $scope.mostraQtdBTCUser = "BTC "+$scope.qtdBTCUser;
      $scope.retRSUser = response.data.response_data.withdrawal_limits.brl.available;
      $scope.retLTCUser = response.data.response_data.withdrawal_limits.ltc.available;
      $scope.retBTCUser = response.data.response_data.withdrawal_limits.btc.available;
      $scope.useronLTC = true;
      $scope.useronBTC = true;
    })
  }

  $scope.ordemInfoLTC = function () {
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    var url = "/tapi/v3/?tapi_method=list_orders&tapi_nonce="+tapi_nonce+"&coin_pair=BRLLTC&has_fills=true";
    console.log($scope.tapiID);
    var encrypttext = $crypthmac.encrypt(url, $scope.secret);
    console.log(encrypttext);

    $http({
      method: 'POST',
      url: 'https://www.mercadobitcoin.net/tapi/v3/',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'TAPI-ID' : $scope.tapiID, 'TAPI-MAC' : encrypttext},
      transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
      },
      data:{'tapi_method': 'list_orders','tapi_nonce': tapi_nonce,'coin_pair': 'BRLLTC','has_fills': true}
    }).then(function successCallback(response) {
      var date = new Date(response.data.server_unix_timestamp*1000);
      $scope.dataAtualizacaoOrdemInfo = "Atualizado em: "+
                                  nomeMeses[date.getMonth()]+" "+
                                  date.getDate()+", "+
                                  date.getHours()+":"+
                                  date.getMinutes();
      $scope.listaOrdemLTC = response.data.response_data.orders;
    })
  }

  $scope.ordemInfoBTC = function () {
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    var url = "/tapi/v3/?tapi_method=list_orders&tapi_nonce="+tapi_nonce+"&coin_pair=BRLBTC&has_fills=true";
    console.log($scope.tapiID);
    var encrypttext = $crypthmac.encrypt(url, $scope.secret);
    console.log(encrypttext);

    $http({
      method: 'POST',
      url: 'https://www.mercadobitcoin.net/tapi/v3/',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'TAPI-ID' : $scope.tapiID, 'TAPI-MAC' : encrypttext},
      transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
      },
      data:{'tapi_method': 'list_orders','tapi_nonce': tapi_nonce,'coin_pair': 'BRLBTC','has_fills': true}
    }).then(function successCallback(response) {
      var date = new Date(response.data.server_unix_timestamp*1000);
      $scope.dataAtualizacaoOrdemInfo = "Atualizado em: "+
                                  nomeMeses[date.getMonth()]+" "+
                                  date.getDate()+", "+
                                  date.getHours()+":"+
                                  date.getMinutes();
      $scope.listaOrdemBTC = response.data.response_data.orders;
    })
  }


  $(document).ready(function(){
    $('.modal').modal();
  });

  $(".button-collapse").sideNav();

  $(document).ready(function() {
    $('select').material_select();
  });


  $scope.transition1 = function () {
    $scope.tab1 = true;
    $scope.tab2 = false;
    $scope.tab3 = false;
    $scope.tab4 = false;
  }

  $scope.transition2 = function () {
    $scope.tab1 = false;
    $scope.tab2 = true;
    $scope.tab3 = false;
    $scope.tab4 = false;
  }

  $scope.tableOrdem1 = function () {
    $scope.table1 = true;
    $scope.table2 = false;
    $scope.tableTabAct1 = "tabs-select-ativo";
    $scope.tableTabAct2 = "";
  }

  $scope.tableOrdem2 = function () {
    $scope.table1 = false;
    $scope.table2 = true;
    $scope.tableTabAct1 = "";
    $scope.tableTabAct2 = "tabs-select-ativo";
  }

  $scope.transition3 = function () {
    $scope.tab1 = false;
    $scope.tab2 = false;
    $scope.tab3 = true;
    $scope.tab4 = false;
  }
  $scope.transition4 = function () {
    $scope.tab1 = false;
    $scope.tab2 = false;
    $scope.tab3 = false;
    $scope.tab4 = true;
  }

  $scope.compraCheckBoxBTC = function () {
    $scope.compraMDLTC = false;
    $scope.compraMDBTC = true;
    console.log("BTC"+$scope.compraMDBTC+"LTC"+$scope.compraMDLTC);
  }

  $scope.compraCheckBoxLTC = function () {
    $scope.compraMDLTC = true;
    $scope.compraMDBTC = false;
    console.log("BTC"+$scope.compraMDBTC+"LTC"+$scope.compraMDLTC);
  }



  var tick = function() {
      $scope.loading = false;

      var onlineRunning = navigator.onLine;
      if (!onlineRunning) {
        $('#modalOnline').modal('open');
        setTimeout(function () {
          $('#modalOnline').modal('close');
          $route.reload();
        }, 60000);
      }else{
        $('#modalOnline').modal('close');
      }

      $http({
        method: 'GET',
        url: 'https://www.mercadobitcoin.net/api/ticker_litecoin/'
      }).then(function successCallback(response) {
          var novoDado = {};
          var date = new Date(response.data.ticker.date*1000);
          $scope.dataAtualizacaoLTC = "Atualizado em: "+
                                      nomeMeses[date.getMonth()]+" "+
                                      date.getDate()+", "+
                                      date.getHours()+":"+
                                      date.getMinutes();
          novoDado["date"] = date.getHours()+":"+date.getMinutes();
          $scope.maiorNegociacaoLTC = response.data.ticker.high;
          novoDado["high"] = $scope.maiorNegociacaoLTC;
          $scope.maiorNegociacaoLTC = $filter('limitTo')(($scope.maiorNegociacaoLTC), 8)
          $scope.menorNegociacaoLTC = response.data.ticker.low;
          novoDado["low"] = $scope.menorNegociacaoLTC;
          $scope.menorNegociacaoLTC = $filter('limitTo')(($scope.menorNegociacaoLTC), 8)
          $scope.volumeMoedaLTC = response.data.ticker.vol;
          novoDado["vol"] = $scope.volumeMoedaLTC;
          $scope.volumeMoedaLTC = $filter('limitTo')(($scope.volumeMoedaLTC), 8)
          $scope.precoUltimoNegociadoLTC = response.data.ticker.last;
          novoDado["last"] = $scope.precoUltimoNegociadoLTC;
          $scope.precoUltimoNegociadoLTC = $filter('limitTo')(($scope.precoUltimoNegociadoLTC), 8)
          $scope.maiorValorCompraLTC = response.data.ticker.buy;
          novoDado["buy"] = $scope.maiorValorCompraLTC;
          $scope.menorValorVendaLTC = response.data.ticker.sell;
          novoDado["sell"] = $scope.menorValorVendaLTC;
          $scope.mediaParaCompra = ($scope.maiorValorCompraLTC + $scope.menorValorVendaLTC)/2;
          if (typeof $scope.qtdLTCUser != 'undefined') {
            var valorReais = $scope.mediaParaCompra * $scope.qtdLTCUser;
            $scope.estadoReaisLTC = "R$ "+$filter('limitTo')((valorReais), 8);
          }
          if($scope.compara($scope.mediaParaCompra) == true){
            $scope.mediaParaCompra = "R$ "+$filter('limitTo')(($scope.mediaParaCompra), 8)
            $scope.insere(novoDado)
            $scope.revisaDBLTC()
          }

        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });

      $scope.insere = function(novoDado){
        $SQLite.ready(function () {
           this.insert('DADOS', novoDado)
               .then(function () { console.log('Inserido Com Sucesso');},
                     function () { console.err('Error!');}
               );
        });
      }

      $scope.revisaDBLTC = function() {
        $SQLite.ready(function () {
            this
                .select('SELECT MAX(id) AS max FROM DADOS')
                .then(
            function () { console.err('Empty Result')},
            function () { console.err('Error!'); },
            function (data) {
              if (data.item.max > 30) {
                $SQLite.ready(function () {
                this.execute('DELETE FROM DADOS WHERE ROWID = 1')
                  .then(function () { console.log('Deletado Com Sucesso'); },
                        function () { console.err('Error!'); }
                  );
                });
              }
            });
          })
      }

      $scope.revisaDBBTC = function() {
        $SQLite.ready(function () {
            this
                .select('SELECT MAX(id) AS max FROM DADOSBTC')
                .then(
            function () { console.err('Empty Result')},
            function () { console.err('Error!'); },
            function (data) {
              if (data.item.max > 30) {
                $SQLite.ready(function () {
                this.execute('DELETE FROM DADOSBTC WHERE ROWID = 1')
                  .then(function () { console.log('Deletado Com Sucesso'); },
                        function () { console.err('Error!'); }
                  );
                });
              }
            });
          })
      }

      $scope.compara = function(atual) {
        $SQLite.ready(function () {
            this
                .select('SELECT (BUY+SELL)/2 AS media FROM DADOS ORDER BY id DESC LIMIT 1')
                .then(
            function () {
              novoInit["date"] = "0:0"; novoInit["high"] = 0;
              novoInit["low"] = 0; novoInit["vol"] = 0;
              novoInit["last"] = 0; novoInit["buy"] = 0;
              novoInit["sell"] = 0;
              $SQLite.ready(function () {
                 this.insert('DADOSBTC', novoInit)
                     .then(function () {
                       var differenca = 0;
                       $scope.corDiferenca = {'color':'#87B4CE'};
                       $scope.diferenca = differenca;
                       var porcentagem = 0.00;
                       $scope.porcentagem = "("+porcentagem+"%)";
                     },
                           function () { console.err('Error!');}
                     );
              });
            },
            function () { console.err('Error!'); },
            function (data) {
              var differenca = atual - data.item.media;
              if (Math.sign(differenca) == -1) {
                $scope.corDiferenca = {'color':'#ff0000'};
                var limitePorcentagem = 5;
              }else if (Math.sign(differenca) == 1) {
                $scope.corDiferenca = {'color':'#00C97E'};
                differenca = "+"+differenca;
                var limitePorcentagem = 4;
              }else if (Math.sign(differenca) == 0) {
                $scope.corDiferenca = {'color':'#87B4CE'};
              }
              $scope.diferenca = $filter('limitTo')((differenca), 8);
              var porcentagem = (differenca/data.item.media)*100
              $scope.porcentagem = "("+$filter('limitTo')((porcentagem), limitePorcentagem)+"%)";
            }
          );
        });
        return true;
      }



      $scope.grafico = function() {
        Chart.defaults.global.defaultFontColor = 'white';
        Chart.defaults.global.elements.line.borderWidth = 5;
        Chart.defaults.global.colors = ['rgba(0,201,126,0.2)','rgba(255,0,0,0.2)','rgba(0,153,255,0.2)'];
        $scope.labels1 = []; $scope.compra = []; $scope.venda = []; $scope.media = [];
        $SQLite.ready(function () {
            this
                .select('SELECT ID, DATE, BUY, SELL, (BUY+SELL)/2 AS media FROM DADOS WHERE ID > (SELECT MAX(id) FROM DADOS)-15')
                .then(
            function () { console.log('Empty Result!'); },
            function () { console.err('Error!'); },
            function (data) {
              console.log('foi!!!');
              $scope.labels1.push(data.item.date);
              $scope.compra.push(data.item.buy);
              $scope.venda.push(data.item.sell);
              $scope.media.push(data.item.media);
              $scope.data1 = [$scope.compra, $scope.venda, $scope.media];
            }
          );
        });
        $scope.labels2 = []; $scope.compraBTC = []; $scope.vendaBTC = []; $scope.mediaBTC = [];
        $SQLite.ready(function () {
            this
                .select('SELECT ID, DATE, BUY, SELL, (BUY+SELL)/2 AS media FROM DADOSBTC WHERE ID > (SELECT MAX(id) FROM DADOSBTC)-15')
                .then(
            function () { console.log('Empty Result!'); },
            function () { console.err('Error!'); },
            function (data) {
              $scope.labels2.push(data.item.date);
              $scope.compraBTC.push(data.item.buy);
              $scope.vendaBTC.push(data.item.sell);
              $scope.mediaBTC.push(data.item.media);
              $scope.data2 = [$scope.compraBTC, $scope.vendaBTC, $scope.mediaBTC];
            }
          );
        });

        $scope.series = ['Valor Compra', 'Valor Venda', 'Valor Média'];
        $scope.onClick = function (points, evt) {
          console.log(points, evt);
        };

        $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
        $scope.options = {
          scales: {
            yAxes: [
              {
                id: 'y-axis-1',
                type: 'linear',
                display: true,
                position: 'left'
              }
            ]
          }
        };
      }

      $scope.concerta = function(){
        $SQLite.ready(function () {
        this.execute('UPDATE DADOS SET date = ? WHERE id = 16', [ '14/6/2017' ])
          .then(function () { console.log('Executado Com Sucesso'); },
                function () { console.err('Error!'); }
          );
        });
      }

      $http({
        method: 'GET',
        url: 'https://www.mercadobitcoin.net/api/ticker/'
      }).then(function successCallback(response) {
          var novoDado = {};
          var date = new Date(response.data.ticker.date*1000);
          $scope.dataAtualizacaoBTC = "Atualizado em: "+
                                      nomeMeses[date.getMonth()]+" "+
                                      date.getDate()+", "+
                                      date.getHours()+":"+
                                      date.getMinutes();
          novoDado["date"] = date.getHours()+":"+date.getMinutes();
          $scope.maiorNegociacaoBTC = response.data.ticker.high;
          novoDado["high"] = $scope.maiorNegociacaoBTC;
          $scope.maiorNegociacaoBTC = $filter('limitTo')(($scope.maiorNegociacaoBTC), 8)
          $scope.menorNegociacaoBTC = response.data.ticker.low;
          novoDado["low"] = $scope.menorNegociacaoBTC;
          $scope.menorNegociacaoBTC = $filter('limitTo')(($scope.menorNegociacaoBTC), 8)
          $scope.volumeMoedaBTC = response.data.ticker.vol;
          novoDado["vol"] = $scope.volumeMoedaBTC;
          $scope.volumeMoedaBTC = $filter('limitTo')(($scope.volumeMoedaBTC), 8)
          $scope.precoUltimoNegociadoBTC = response.data.ticker.last;
          novoDado["last"] = $scope.precoUltimoNegociadoBTC;
          $scope.precoUltimoNegociadoBTC = $filter('limitTo')(($scope.precoUltimoNegociadoBTC), 8)
          $scope.maiorValorCompraBTC = response.data.ticker.buy;
          novoDado["buy"] = $scope.maiorValorCompraBTC;
          $scope.menorValorVendaBTC = response.data.ticker.sell;
          novoDado["sell"] = $scope.menorValorVendaBTC;
          $scope.mediaParaCompraBTC = ($scope.maiorValorCompraBTC + $scope.menorValorVendaBTC)/2;
          if (typeof $scope.qtdBTCUser != 'undefined') {
            var valorReais = $scope.mediaParaCompraBTC * $scope.qtdBTCUser;
            $scope.estadoReaisBTC = "R$ "+$filter('limitTo')((valorReais), 8);
          }
          if($scope.comparaBTC($scope.mediaParaCompraBTC) == true){
            $scope.mediaParaCompraBTC = "R$ "+$filter('limitTo')(($scope.mediaParaCompraBTC), 8)
            if($scope.insereBTC(novoDado) == true){
              $scope.grafico();
              $scope.revisaDBBTC();
            }
          }
        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });

    $scope.insereBTC = function(novoDado){
      $SQLite.ready(function () {
         this.insert('DADOSBTC', novoDado)
             .then(function () { console.log('Inserido Com Sucesso');},
                   function () { console.err('Error!');}
             );
      });
      return true;
    }

    $scope.comparaBTC = function(atual) {
      $SQLite.ready(function () {
          this
              .select('SELECT (BUY+SELL)/2 AS media FROM DADOSBTC ORDER BY id DESC LIMIT 1')
              .then(
          function () {
            novoInit["date"] = "0:0"; novoInit["high"] = 0;
            novoInit["low"] = 0; novoInit["vol"] = 0;
            novoInit["last"] = 0; novoInit["buy"] = 0;
            novoInit["sell"] = 0;
            $SQLite.ready(function () {
               this.insert('DADOSBTC', novoInit)
                   .then(function () {
                     var differenca = 0;
                     $scope.corDiferencaBTC = {'color':'#87B4CE'};
                     $scope.diferencaBTC = differenca;
                     var porcentagem = 0.00;
                     $scope.porcentagemBTC = "("+porcentagem+"%)";
                   },
                         function () { console.err('Error!');}
                   );
            });
          },
          function () { console.err('Error!'); },
          function (data) {
            if(data != null){
              var differenca = atual - data.item.media;
              if (Math.sign(differenca) == -1) {
                $scope.corDiferencaBTC = {'color':'#ff0000'};
                var limitePorcentagem = 5;
              }else if (Math.sign(differenca) == 1) {
                $scope.corDiferencaBTC = {'color':'#00C97E'};
                differenca = "+"+differenca;
                var limitePorcentagem = 4;
              }else if (Math.sign(differenca) == 0) {
                $scope.corDiferencaBTC = {'color':'#87B4CE'};
              }
              $scope.diferencaBTC = $filter('limitTo')((differenca), 8);
              var porcentagem = (differenca/data.item.media)*100
              $scope.porcentagemBTC = "("+$filter('limitTo')((porcentagem), limitePorcentagem)+"%)";
            }
          }
        );
      });
      return true;
    }

      $timeout(tick, $scope.tickExecucao); // reset the timer
  }

  // Start the timer
  $timeout(tick, $scope.tickInicial);
});

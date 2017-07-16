app.controller("mainBTCController", function ($scope, $rootScope, $http, $SQLite, $timeout, $filter) {
  var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  $scope.tickInicial = 3000;
  $scope.tickExecucao = 61000;
  var tick = function() {
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
            novoDado["date"] = date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear();
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
            $scope.comparaBTC($scope.mediaParaCompraBTC);
            $scope.mediaParaCompraBTC = $filter('limitTo')(($scope.mediaParaCompraBTC), 8)
            $scope.insereBTC(novoDado);
            $scope.graficoLTC();
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
      }

      $scope.comparaBTC = function(atual) {
        $SQLite.ready(function () {
            this
                .select('SELECT (BUY+SELL)/2 AS media FROM DADOSBTC ORDER BY id DESC LIMIT 1')
                .then(
            function () { console.log('Empty Result!'); },
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
      }

      $scope.graficoBTC = function() {
        Chart.defaults.global.defaultFontColor = 'white';
        Chart.defaults.global.elements.line.borderWidth = 5;
        Chart.defaults.global.colors2 = ['rgba(0,201,126,0.2)','rgba(255,0,0,0.2)','rgba(0,153,255,0.2)'];


        $scope.series2 = ['Valor Compra', 'Valor Venda', 'Valor Média'];
        $scope.onClick2 = function (points, evt) {
          console.log(points, evt);
        };

        $scope.datasetOverride2 = [{ yAxisID: 'y-axis-1' }];
        $scope.options2 = {
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

      $timeout(tick, $scope.tickExecucao); // reset the timer
  }

  // Start the timer
  $timeout(tick, $scope.tickInicial);
});

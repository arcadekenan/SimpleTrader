app.controller("mainController", function ($scope, $http, $SQLite, $timeout, $filter) {
  var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  $scope.tickInicial = 3000;
  $scope.tickExecucao = 61000;
  $scope.loading = true;
  var tick = function() {
      $scope.loading = false;
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
          novoDado["date"] = date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear();
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
          $scope.compara($scope.mediaParaCompra);
          $scope.mediaParaCompra = $filter('limitTo')(($scope.mediaParaCompra), 8)
          $scope.insere(novoDado);
          $scope.graficoLTC();
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

      $scope.compara = function(atual) {
        $SQLite.ready(function () {
            this
                .select('SELECT (BUY+SELL)/2 AS media FROM DADOS ORDER BY id DESC LIMIT 1')
                .then(
            function () { console.log('Empty Result!'); },
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
      }

      $scope.graficoLTC = function() {
        Chart.defaults.global.defaultFontColor = 'white';
        Chart.defaults.global.elements.line.borderWidth = 5;
        Chart.defaults.global.colors = ['rgba(0,201,126,0.2)','rgba(255,0,0,0.2)','rgba(0,153,255,0.2)'];
        $scope.labels = []; $scope.compra = []; $scope.venda = []; $scope.media = [];
        $SQLite.ready(function () {
            this
                .select('SELECT ID, DATE, BUY, SELL, (BUY+SELL)/2 AS media FROM DADOS WHERE ID > (SELECT count() from DADOS)-10')
                .then(
            function () { console.log('Empty Result!'); },
            function () { console.err('Error!'); },
            function (data) {
              $scope.labels.push(data.item.date);
              $scope.compra.push(data.item.buy);
              $scope.venda.push(data.item.sell);
              $scope.media.push(data.item.media);
              $scope.data = [$scope.compra, $scope.venda, $scope.media];
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
      $timeout(tick, $scope.tickExecucao); // reset the timer
  }

  // Start the timer
  $timeout(tick, $scope.tickInicial);
});

app.controller("mainController", function ($scope, $http, $SQLite) {


  var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
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
      $scope.menorNegociacaoLTC = response.data.ticker.low;
      novoDado["low"] = $scope.menorNegociacaoLTC;
      $scope.volumeMoedaLTC = response.data.ticker.vol;
      novoDado["vol"] = $scope.volumeMoedaLTC;
      $scope.precoUltimoNegociadoLTC = response.data.ticker.last;
      novoDado["last"] = $scope.precoUltimoNegociadoLTC;
      $scope.maiorValorCompraLTC = response.data.ticker.buy;
      novoDado["buy"] = $scope.maiorValorCompraLTC;
      $scope.menorValorVendaLTC = response.data.ticker.sell;
      novoDado["sell"] = $scope.menorValorVendaLTC;
      $scope.insere(novoDado);
      $scope.graficoLTC();


      //$scope.consulta();
      //google.charts.setOnLoadCallback(graficoLTC);

      //$scope.dataAtualizacaoLTC = date.getMonth();
      // this callback will be called asynchronously
      // when the response is available
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $scope.insere = function(novoDado){
    $SQLite.ready(function () {
       this.insert('DADOS', novoDado) // this.replace
           .then(function () { console.log('Inserido Com Sucesso'); },
                 function () { console.err('Error!'); }
           );
    });
  }

  $scope.graficoLTC = function() {
    Chart.defaults.global.defaultFontColor = 'white';
    $scope.labels = [];
    $scope.data = [];
    $SQLite.ready(function () { // The DB is created and prepared async.
        this
            .select('SELECT date, buy, buy, sell, sell FROM DADOS')
            .then(
        function () { console.log('Empty Result!'); },
        function () { console.err('Error!'); },
        function (data) {
          $scope.labels.push(data.item.date);
          $scope.data.push(data.item.buy);
        }
      );
    });
    //$scope.series = ['Series A', 'Series B'];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    $scope.colors = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
    $scope.options = {
      scales: {
        yAxes: [
          {
            id: 'y-axis-1',
            type: 'linear',
            display: true,
            position: 'left'
          },
          {
            id: 'y-axis-2',
            type: 'linear',
            display: true,
            position: 'right'
          }
        ]
      }
    };
  }









/*
  function graficoLTC() {
    //console.log("eu");
    //console.log($scope.dadoGrafico);
    $scope.elementos = $scope.consulta();
    console.log(typeof($scope.elementos));

    console.log(result);
    var data = google.visualization.arrayToDataTable(array, true);

    var options = {
      legend: 'none',
      bar: { groupWidth: '100%' }, // Remove space between bars.
      candlestick: {
        fallingColor: { strokeWidth: 0, fill: '#a52714' }, // red
        risingColor: { strokeWidth: 0, fill: '#0f9d58' }   // green
      }
    };
    var chart = new google.visualization.CandlestickChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  }
*/
  $scope.concerta = function(){
    $SQLite.ready(function () {
    this.execute('UPDATE DADOS SET date = ? WHERE id = 16', [ '14/6/2017' ])
      .then(function () { console.log('Executado Com Sucesso'); },
            function () { console.err('Error!'); }
      );
    });
  }

});

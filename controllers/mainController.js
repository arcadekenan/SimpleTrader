app.controller("mainController", function ($scope, $rootScope, $crypthmac, $http, $SQLite, $timeout, $filter, $route, $firebaseArray) {

  var config = {
    apiKey: "AIzaSyA3NF-87o3eKPE9ksb__D1J90Ay0Hwsdpk",
    authDomain: "simpletraderserver.firebaseapp.com",
    databaseURL: "https://simpletraderserver.firebaseio.com",
    projectId: "simpletraderserver",
    storageBucket: "simpletraderserver.appspot.com",
    messagingSenderId: "320522901784"
  };

  firebase.initializeApp(config);

  var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  var pjson = require('./package.json');
  var onlineStart = navigator.onLine;
  $scope.versaoST = pjson.version;
  $scope.tickInicial = 3000;
  $scope.tickExecucao = 60000;
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
  $scope.vendaMDLTC = true;
  $scope.vendaMDBTC = false;
  $scope.grafLTCInit = true;
  $scope.grafBTCInit = true;
  $scope.arrayLTC = [];
  $scope.arrayBTC = [];

  firebase.database().ref('/dadosLTC').limitToLast(15).once('value').then(function(snapshot) {
    var key = snapshot.val();
    for (var obj in key) {
      $scope.arrayLTC.push(key[obj]);
    }
  });

  firebase.database().ref('/dadosBTC').limitToLast(15).once('value').then(function(snapshot) {
    var key = snapshot.val();
    for (var obj in key) {
      $scope.arrayBTC.push(key[obj]);
    }
  });

  /*
  if (!onlineStart) {
    $scope.loading = false;
    $('#modalOnline').modal('open', {dismissible: false});
    setTimeout(function () {
      $('#modalOnline').modal('close');
      $route.reload();
    }, 60000);
  }*/

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
      console.log(response);
      var date = new Date(response.data.server_unix_timestamp*1000);
      $scope.dataAtualizacaoOrdemInfo = "Atualizado em: "+
                                  nomeMeses[date.getMonth()]+" "+
                                  date.getDate()+", "+
                                  date.getHours()+":"+
                                  date.getMinutes();
      $scope.listaOrdemBTC = response.data.response_data.orders;
    })
  }

  $scope.compraMercado = function () {
    console.log("Comecei a Comprar");
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    if($scope.compraMDLTC){
      var coin_pair = "BRLLTC";
      var quantity = $scope.quantidadeMoedaCompraLTC;
      var limit_price = $scope.mediaParaCompraNum.toFixed(5);
    }else if($scope.compraMDBTC){
      var coin_pair = "BRLBTC";
      var quantity = $scope.quantidadeMoedaCompraBTC;
      var limit_price = $scope.mediaParaCompraBTCNum.toFixed(5);
    }
    var url = "/tapi/v3/?tapi_method=place_buy_order&tapi_nonce="+tapi_nonce+"&coin_pair="+coin_pair+"&quantity="+quantity+"&limit_price="+limit_price;
    console.log("Setei as variaveis:"+coin_pair+quantity+" -- "+limit_price);
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
      data:{'tapi_method': 'place_buy_order','tapi_nonce': tapi_nonce,'coin_pair': coin_pair,'quantity': quantity, 'limit_price': limit_price}
    }).then(function successCallback(response) {
      if(response.data.status_code != 100){
        if(response.data.status_code == 206){
          Materialize.toast("Valor não permitido", 5000, 'toast-falha')
        }else{
          Materialize.toast(response.data.error_message, 5000, 'toast-falha')
        }
      }else{
        Materialize.toast("Ordem de Compra executada com sucesso!", 5000, 'toast-sucesso')
        if($scope.compraMDLTC){
          $scope.ordemInfoLTC();
          $scope.tableOrdem1();
          $scope.transition2();
        }else if($scope.compraMDBTC){
          $scope.ordemInfoBTC();
          $scope.tableOrdem2();
          $scope.transition2();
        }
      }
    })
  }

  $scope.vendaMercado = function () {
    var dateTime = new Date();
    var tapi_nonce = dateTime.getTime();
    console.log("Comecei a Comprar");

    if($scope.vendaMDLTC){
      var coin_pair = "BRLLTC";
      var quantity = $scope.valorRealVenda;
      var limit_price = $scope.mediaParaCompraNum.toFixed(5);
    }else if($scope.vendaMDBTC){
      var coin_pair = "BRLBTC";
      var quantity = $scope.valorRealVenda;
      var limit_price = $scope.mediaParaCompraBTCNum.toFixed(5);
    }
    var url = "/tapi/v3/?tapi_method=place_sell_order&tapi_nonce="+tapi_nonce+"&coin_pair="+coin_pair+"&quantity="+quantity+"&limit_price="+limit_price;
    var encrypttext = $crypthmac.encrypt(url, $scope.secret);
    console.log("Setei as variaveis:"+coin_pair+quantity+" -- "+limit_price);
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
      data:{'tapi_method': 'place_sell_order','tapi_nonce': tapi_nonce,'coin_pair': coin_pair,'quantity': quantity, 'limit_price': limit_price}
    }).then(function successCallback(response) {
      console.log(response);
      if(response.data.status_code != 100){
        if(response.data.status_code == 206){
          Materialize.toast("Valor não permitido", 5000, 'toast-falha')
        }else{
          Materialize.toast(response.data.error_message, 5000, 'toast-falha')
        }
      }else{
        Materialize.toast("Ordem de Venda executada com sucesso!", 5000, 'toast-sucesso')
        if($scope.compraMDLTC){
          $scope.ordemInfoLTC();
          $scope.tableOrdem1();
          $scope.transition2();
        }else if($scope.compraMDBTC){
          $scope.ordemInfoBTC();
          $scope.tableOrdem2();
          $scope.transition2();
        }
      }
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
  }

  $scope.compraCheckBoxLTC = function () {
    $scope.compraMDLTC = true;
    $scope.compraMDBTC = false;
  }

  $scope.vendaCheckBoxBTC = function () {
    $scope.vendaMDLTC = false;
    $scope.vendaMDBTC = true;
  }

  $scope.vendaCheckBoxLTC = function () {
    $scope.vendaMDLTC = true;
    $scope.vendaMDBTC = false;
  }

  $scope.selectSaldoTotalCompra = function () {
    $scope.valorRealCompra = $scope.qtdRSUser;
    document.getElementById("valorReal").value = $scope.valorRealCompra;
    $scope.labelValorR$Ativado = "active";
    $scope.quantidadeMoedaCompraLTC = ($scope.valorRealCompra / $scope.mediaParaCompraNum).toFixed(8);
    $scope.quantidadeMoedaCompraBTC = ($scope.valorRealCompra / $scope.mediaParaCompraBTCNum).toFixed(8);
    $scope.labelQuantidadeMoeda = "active";
    $scope.comissaoLTCCompra = ($scope.quantidadeMoedaCompraLTC * 0.007).toFixed(8);
    $scope.comissaoBTCCompra = ($scope.quantidadeMoedaCompraBTC * 0.007).toFixed(8);
    $scope.labelComissao = "active";
    $scope.liquidoCompraLTC = $scope.quantidadeMoedaCompraLTC - $scope.comissaoLTCCompra;
    $scope.liquidoCompraBTC = $scope.quantidadeMoedaCompraBTC - $scope.comissaoBTCCompra;
    $scope.labelliquidoCompra = "active";
  }

  $scope.selectSaldoTotalVendaLTC = function (){
    $scope.valorRealVenda = $scope.qtdLTCUser;
    document.getElementById("valorMD").value = $scope.valorRealVenda;
    $scope.labelValorMDAtivado = "active";
    $scope.quantidadeMoedaVendaLTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraNum).toFixed(8);
    $scope.quantidadeMoedaVendaBTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraBTCNum).toFixed(8);
    $scope.labelQuantidadeVenda = "active";
    $scope.comissaoVendaLTC = ($scope.quantidadeMoedaVendaLTC * 0.007).toFixed(8);
    $scope.comissaoVendaBTC = ($scope.quantidadeMoedaVendaBTC * 0.007).toFixed(8);
    $scope.labelComissaoVenda = "active";
    $scope.liquidoVendaLTC = $scope.quantidadeMoedaVendaLTC - $scope.comissaoVendaLTC;
    $scope.liquidoVendaBTC = $scope.quantidadeMoedaVendaBTC - $scope.comissaoVendaBTC;
    $scope.labelliquidoVenda = "active";
  }

  $scope.selectSaldoTotalVendaBTC = function (){
    $scope.valorRealVenda = $scope.qtdBTCUser;
    document.getElementById("valorMD").value = $scope.valorRealVenda;
    $scope.labelValorMDAtivado = "active";
    $scope.quantidadeMoedaVendaLTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraNum).toFixed(8);
    $scope.quantidadeMoedaVendaBTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraBTCNum).toFixed(8);
    $scope.labelQuantidadeVenda = "active";
    $scope.comissaoVendaLTC = ($scope.quantidadeMoedaVendaLTC * 0.007).toFixed(8);
    $scope.comissaoVendaBTC = ($scope.quantidadeMoedaVendaBTC * 0.007).toFixed(8);
    $scope.labelComissaoVenda = "active";
    $scope.liquidoVendaLTC = $scope.quantidadeMoedaVendaLTC - $scope.comissaoVendaLTC;
    $scope.liquidoVendaBTC = $scope.quantidadeMoedaVendaBTC - $scope.comissaoVendaBTC;
    $scope.labelliquidoVenda = "active";
  }

  $scope.valorInformado = function () {
    $scope.valorRealCompra = document.getElementById('valorReal').value;
    $scope.labelValorR$Ativado = "active";
    $scope.quantidadeMoedaCompraLTC = (document.getElementById('valorReal').value / $scope.mediaParaCompraNum).toFixed(8);
    $scope.quantidadeMoedaCompraBTC = (document.getElementById('valorReal').value / $scope.mediaParaCompraBTCNum).toFixed(8);
    $scope.labelQuantidadeMoeda = "active";
    $scope.comissaoLTCCompra = ($scope.quantidadeMoedaCompraLTC * 0.007).toFixed(8);
    $scope.comissaoBTCCompra = ($scope.quantidadeMoedaCompraBTC * 0.007).toFixed(8);
    $scope.labelComissao = "active";
    $scope.liquidoCompraLTC = $scope.quantidadeMoedaCompraLTC - $scope.comissaoLTCCompra;
    $scope.liquidoCompraBTC = $scope.quantidadeMoedaCompraBTC - $scope.comissaoBTCCompra;
    $scope.labelliquidoCompra = "active";
  }

  $scope.valorInformadoMD = function () {
    $scope.valorRealVenda = document.getElementById('valorMD').value;
    $scope.labelValorMDAtivado = "active";
    $scope.quantidadeMoedaVendaLTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraNum).toFixed(8);
    $scope.quantidadeMoedaVendaBTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraBTCNum).toFixed(8);
    $scope.labelQuantidadeVenda = "active";
    $scope.comissaoVendaLTC = ($scope.quantidadeMoedaVendaLTC * 0.007).toFixed(8);
    $scope.comissaoVendaBTC = ($scope.quantidadeMoedaVendaBTC * 0.007).toFixed(8);
    $scope.labelComissaoVenda = "active";
    $scope.liquidoVendaLTC = $scope.quantidadeMoedaVendaLTC - $scope.comissaoVendaLTC;
    $scope.liquidoVendaBTC = $scope.quantidadeMoedaVendaBTC - $scope.comissaoVendaBTC;
    $scope.labelliquidoVenda = "active";
  }


  var tick = function() {
      var onlineRunning = navigator.onLine;
      if (!onlineRunning) {
        $('#modalOnline').modal('open');
      }else{
        $('#modalOnline').modal('close');
      }

      $scope.grafico = function() {
        console.log("Iniciando Grafico");
        Chart.defaults.global.defaultFontColor = 'white';
        Chart.defaults.global.elements.line.borderWidth = 5;
        Chart.defaults.global.colors = ['rgba(0,201,126,0.2)','rgba(255,0,0,0.2)','rgba(0,153,255,0.2)'];
        $scope.labels1 = []; $scope.compra = []; $scope.venda = []; $scope.media = [];
        $scope.labels2 = []; $scope.compraBTC = []; $scope.vendaBTC = []; $scope.mediaBTC = [];
        console.log("configurado");
        for (var i in $scope.arrayLTC) {
          $scope.labels1.push($scope.arrayLTC[i].data);
          $scope.compra.push($scope.arrayLTC[i].buy);
          $scope.venda.push($scope.arrayLTC[i].sell);
          $scope.media.push(($scope.arrayLTC[i].buy + $scope.arrayLTC[i].sell)/2);
          $scope.data1 = [$scope.compra, $scope.venda, $scope.media];
        }
        console.log("setado1");
        for (var i in $scope.arrayBTC) {
          $scope.labels2.push($scope.arrayBTC[i].data);
          $scope.compraBTC.push($scope.arrayBTC[i].buy);
          $scope.vendaBTC.push($scope.arrayBTC[i].sell);
          $scope.mediaBTC.push(($scope.arrayBTC[i].buy + $scope.arrayBTC[i].sell)/2);
          $scope.data2 = [$scope.compraBTC, $scope.vendaBTC, $scope.mediaBTC];
        }
        console.log("setado2");
        $scope.series = ['Valor Compra', 'Valor Venda', 'Valor Média'];
        $scope.onClick = function (points, evt) {
          console.log(points, evt);
        };

        $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
        $scope.options = {scales: {yAxes: [{id: 'y-axis-1', type: 'linear', display: true, position: 'left'}]}};
      }

      if ($scope.grafLTCInit) {
        var date = new Date();
        $scope.dataAtualizacaoLTC = "Atualizado em: "+
                                    nomeMeses[date.getMonth()]+" "+
                                    date.getDate()+", "+
                                    date.getHours()+":"+
                                    date.getMinutes();
        $scope.maiorNegociacaoLTC = $filter('limitTo')(($scope.arrayLTC[14].high), 8)
        $scope.menorNegociacaoLTC = $filter('limitTo')(($scope.arrayLTC[14].low), 8)
        $scope.volumeMoedaLTC = $filter('limitTo')(($scope.arrayLTC[14].vol), 8)
        $scope.precoUltimoNegociadoLTC = $filter('limitTo')(($scope.arrayLTC[14].last), 8)
        $scope.maiorValorCompraLTC = $scope.arrayLTC[14].buy;
        $scope.menorValorVendaLTC = $scope.arrayLTC[14].sell;
        $scope.mediaParaCompra = ($scope.arrayLTC[14].buy + $scope.arrayLTC[14].sell)/2;
        $scope.mediaParaCompraPast = ($scope.arrayLTC[13].buy + $scope.arrayLTC[13].sell)/2;
        $scope.mediaParaCompraNum = $scope.mediaParaCompra;
        if ($scope.logado) {
          var valorReais = $scope.mediaParaCompra * $scope.qtdLTCUser;
          $scope.estadoReaisLTC = "R$ "+$filter('number')((valorReais), 2);
        }
        var differenca = $scope.mediaParaCompra - $scope.mediaParaCompraPast;
        if (Math.sign(differenca) == -1) {
          $scope.corDiferenca = {'color':'#ff0000'};
          $scope.diferenca = $filter('number')((differenca), 4);
        }else if (Math.sign(differenca) == 1) {
          $scope.corDiferenca = {'color':'#00C97E'};
          $scope.diferenca = "+"+$filter('number')((differenca), 4);

        }else if (Math.sign(differenca) == 0) {
          $scope.corDiferenca = {'color':'#87B4CE'};
          $scope.diferenca = $filter('number')((differenca), 4);
        }
        var porcentagem = (differenca/$scope.mediaParaCompraPast)*100
        $scope.porcentagem = "("+$filter('number')((porcentagem), 2)+"%)";
        $scope.mediaParaCompra = "R$ "+$filter('limitTo')(($scope.mediaParaCompra), 8)
        $scope.grafLTCInit = false;
      }else{
        firebase.database().ref('/dadosLTC').limitToLast(1).once('value').then(function(snapshot) {
          var key = snapshot.val();
          for (var obj in key) {
            $scope.arrayLTC.shift();
            $scope.arrayLTC.push(key[obj]);
          }
        });
      }

      if ($scope.grafBTCInit) {
        var date = new Date();
        $scope.dataAtualizacaoBTC = "Atualizado em: "+
                                    nomeMeses[date.getMonth()]+" "+
                                    date.getDate()+", "+
                                    date.getHours()+":"+
                                    date.getMinutes();
        $scope.maiorNegociacaoBTC = $filter('limitTo')(($scope.arrayBTC[14].high), 8)
        $scope.menorNegociacaoBTC = $filter('limitTo')(($scope.arrayBTC[14].low), 8)
        $scope.volumeMoedaBTC = $filter('limitTo')(($scope.arrayBTC[14].vol), 8)
        $scope.precoUltimoNegociadoBTC = $filter('limitTo')(($scope.arrayBTC[14].last), 8)
        $scope.maiorValorCompraBTC = $scope.arrayBTC[14].buy;
        $scope.menorValorVendaBTC = $scope.arrayBTC[14].sell;
        $scope.mediaParaCompraBTC = ($scope.arrayBTC[14].buy + $scope.arrayBTC[14].sell)/2;
        $scope.mediaParaCompraBTCPast = ($scope.arrayBTC[13].buy + $scope.arrayBTC[13].sell)/2;
        $scope.mediaParaCompraBTCNum = $scope.mediaParaCompraBTC;
        if ($scope.logado) {
          var valorReais = $scope.mediaParaCompraBTC * $scope.qtdBTCUser;
          $scope.estadoReaisBTC = "R$ "+$filter('number')((valorReais), 2);
        }
        var differenca = $scope.mediaParaCompraBTC - $scope.mediaParaCompraBTCPast;
        if (Math.sign(differenca) == -1) {
          $scope.corDiferencaBTC = {'color':'#ff0000'};
          $scope.diferencaBTC = $filter('number')((differenca), 4);
        }else if (Math.sign(differenca) == 1) {
          $scope.corDiferencaBTC = {'color':'#00C97E'};
          $scope.diferencaBTC = "+"+$filter('number')((differenca), 4);

        }else if (Math.sign(differenca) == 0) {
          $scope.corDiferencaBTC = {'color':'#87B4CE'};
          $scope.diferencaBTC = $filter('number')((differenca), 4);
        }
        var porcentagem = (differenca/$scope.mediaParaCompraBTCPast)*100
        $scope.porcentagemBTC = "("+$filter('number')((porcentagem), 2)+"%)";
        $scope.mediaParaCompraBTC = "R$ "+$filter('limitTo')(($scope.mediaParaCompraBTC), 8)
        $scope.grafBTCInit = false;
      }else{
        firebase.database().ref('/dadosBTC').limitToLast(1).once('value').then(function(snapshot) {
          var key = snapshot.val();
          for (var obj in key) {
            $scope.arrayBTC.shift();
            $scope.arrayBTC.push(key[obj]);
          }
        });
      }

      $scope.grafico();
      $scope.loading = false;
      $timeout(tick, $scope.tickExecucao); // reset the timer
  }

  // Start the timer
  $timeout(tick, $scope.tickInicial);
});

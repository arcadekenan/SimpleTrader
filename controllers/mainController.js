app.controller("mainController", function ($scope, $rootScope, $crypthmac, $http, $SQLite, $timeout, $filter, $route, $firebaseArray) {

  var onlineRunning = navigator.onLine;
  if (!onlineRunning) {
    $('#modalOnline').modal('open');
  } else {
    var config = {
      apiKey: "AIzaSyA3NF-87o3eKPE9ksb__D1J90Ay0Hwsdpk",
      authDomain: "simpletraderserver.firebaseapp.com",
      databaseURL: "https://simpletraderserver.firebaseio.com",
      projectId: "simpletraderserver",
      storageBucket: "simpletraderserver.appspot.com",
      messagingSenderId: "320522901784"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    var nomeMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    var pjson = require('./package.json');
    var onlineStart = navigator.onLine;
    $scope.versaoST = pjson.version;
    $scope.tickInicial = 3000;
    $scope.tickExecucao = 60000;
    $scope.loading = true;
    $scope.useronLTC = false;
    $scope.useronBTC = false;
    $scope.useronBCH = false;
    $scope.logado = false;
    $scope.modalLogin = "modal-logar"
    $scope.tab0 = true;
    $scope.tab1 = false;
    $scope.tab2 = false;
    $scope.tab3 = false;
    $scope.tab4 = false;
    $scope.tab5 = false;
    $scope.table1 = true;
    $scope.table2 = false;
    $scope.table3 = false;
    $scope.tableTabAct1 = "tabs-select-ativo";
    $scope.tableTabAct2 = "";
    $scope.tableTabAct3 = "";
    $scope.compraMDLTC = true;
    $scope.compraMDBTC = false;
    $scope.compraMDBCH = false;
    $scope.vendaMDLTC = true;
    $scope.vendaMDBTC = false;
    $scope.vendaMDBCH = false;
    $scope.grafLTCInit = true;
    $scope.grafBTCInit = true;
    $scope.grafBCHInit = true;
    $scope.init = false;
    $scope.arrayLTC = [];
    $scope.arrayBTC = [];
    $scope.arrayBCH = [];
    $scope.orderBookLTCAsks = [];
    $scope.orderBookBTCAsks = [];
    $scope.orderBookBCHAsks = [];
    $scope.orderBookLTCBids = [];
    $scope.orderBookBTCBids = [];
    $scope.orderBookBCHBids = [];
    $scope.slides = ["1","2","3"];
    $scope.carouselIndex = 0;

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

    firebase.database().ref('/dadosBCH').limitToLast(15).once('value').then(function(snapshot) {
      var key = snapshot.val();
      for (var obj in key) {
        $scope.arrayBCH.push(key[obj]);
      }
    });

    firebase.database().ref('/orderBookLTC').once('value').then(function(snapshot) {
      var key = snapshot.val();
      for (var obj in key.ask) {
        $scope.orderBookLTCAsks.push(key.ask[obj]);
      }
      for (var obj in key.bid) {
        $scope.orderBookLTCBids.push(key.bid[obj]);
      }
    });

    firebase.database().ref('/orderBookBTC').once('value').then(function(snapshot) {
      var key = snapshot.val();
      for (var obj in key.ask) {
        $scope.orderBookBTCAsks.push(key.ask[obj]);
      }
      for (var obj in key.bid) {
        $scope.orderBookBTCBids.push(key.bid[obj]);
      }
    });

    firebase.database().ref('/orderBookBCH').once('value').then(function(snapshot) {
      var key = snapshot.val();
      for (var obj in key.ask) {
        $scope.orderBookBCHAsks.push(key.ask[obj]);
      }
      for (var obj in key.bid) {
        $scope.orderBookBCHBids.push(key.bid[obj]);
      }
    });


    $scope.login = function () {
      $scope.tapiIDInp = document.getElementById('user').value;
      $scope.secretInp = document.getElementById('password').value;
      var dateTime = new Date();
      var tapi_nonce = dateTime.getTime();
      var url = "/tapi/v3/?tapi_method=get_account_info&tapi_nonce="+tapi_nonce;
      var encrypttext = $crypthmac.encrypt(url, $scope.secretInp);

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
          if(response.data.status_code != 100){
            Materialize.toast("Falha ao Logar. Verifique seus Dados e Tente Novamente", 5000, 'toast-falha')
          }else{
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
          }
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
          $scope.useronLTC = true;
          $scope.useronBTC = true;
          $scope.useronBCH = true;
          $scope.logado = true;
          $scope.transition1();
          $scope.modalLogin = "modal-logado"
          $scope.usrInfo();
          $scope.ordemInfoLTC();
          $scope.ordemInfoBTC();
          $scope.ordemInfoBCH();
        }
      );
    });

    $scope.usrInfo = function () {
      var dateTime = new Date();
      var tapi_nonce = dateTime.getTime();
      var url = "/tapi/v3/?tapi_method=get_account_info&tapi_nonce="+tapi_nonce;
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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
        $scope.mostraQtdLTCUser = $filter('number')(($scope.qtdLTCUser), 4);
        $scope.qtdBTCUser = response.data.response_data.balance.btc.available;
        $scope.mostraQtdBTCUser = $filter('number')(($scope.qtdBTCUser), 4);
        $scope.qtdBCHUser = response.data.response_data.balance.bch.available;
        $scope.mostraQtdBCHUser = $filter('number')(($scope.qtdBCHUser), 4);
        $scope.retRSUser = response.data.response_data.withdrawal_limits.brl.available;
        $scope.retLTCUser = response.data.response_data.withdrawal_limits.ltc.available;
        $scope.retBTCUser = response.data.response_data.withdrawal_limits.btc.available;
        $scope.retBCHUser = response.data.response_data.withdrawal_limits.bch.available;
      })
    }

    $scope.ordemInfoLTC = function () {
      var dateTime = new Date();
      var tapi_nonce = dateTime.getTime();
      var url = "/tapi/v3/?tapi_method=list_orders&tapi_nonce="+tapi_nonce+"&coin_pair=BRLLTC&has_fills=true";
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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

    $scope.ordemInfoBCH = function () {
      var dateTime = new Date();
      var tapi_nonce = dateTime.getTime();
      var url = "/tapi/v3/?tapi_method=list_orders&tapi_nonce="+tapi_nonce+"&coin_pair=BRLBCH&has_fills=true";
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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
        data:{'tapi_method': 'list_orders','tapi_nonce': tapi_nonce,'coin_pair': 'BRLBCH','has_fills': true}
      }).then(function successCallback(response) {
        var date = new Date(response.data.server_unix_timestamp*1000);
        $scope.dataAtualizacaoOrdemInfo = "Atualizado em: "+
                                    nomeMeses[date.getMonth()]+" "+
                                    date.getDate()+", "+
                                    date.getHours()+":"+
                                    date.getMinutes();
        $scope.listaOrdemBCH = response.data.response_data.orders;
      })
    }


    $scope.compraMercado = function () {
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
      }else if($scope.compraMDBCH){
        var coin_pair = "BRLBCH";
        var quantity = $scope.quantidadeMoedaCompraBCH;
        var limit_price = $scope.mediaParaCompraBCHNum.toFixed(5);
      }
      var url = "/tapi/v3/?tapi_method=place_buy_order&tapi_nonce="+tapi_nonce+"&coin_pair="+coin_pair+"&quantity="+quantity+"&limit_price="+limit_price;
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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
          }else if($scope.compraMDBCH){
            $scope.ordemInfoBCH();
            $scope.tableOrdem3();
            $scope.transition2();
          }
        }
      })
    }

    $scope.vendaMercado = function () {
      var dateTime = new Date();
      var tapi_nonce = dateTime.getTime();

      if($scope.vendaMDLTC){
        var coin_pair = "BRLLTC";
        var quantity = $scope.valorRealVenda;
        var limit_price = $scope.mediaParaCompraNum.toFixed(5);
      }else if($scope.vendaMDBTC){
        var coin_pair = "BRLBTC";
        var quantity = $scope.valorRealVenda;
        var limit_price = $scope.mediaParaCompraBTCNum.toFixed(5);
      }else if($scope.vendaMDBCH){
        var coin_pair = "BRLBCH";
        var quantity = $scope.valorRealVenda;
        var limit_price = $scope.mediaParaCompraBCHNum.toFixed(5);
      }
      var url = "/tapi/v3/?tapi_method=place_sell_order&tapi_nonce="+tapi_nonce+"&coin_pair="+coin_pair+"&quantity="+quantity+"&limit_price="+limit_price;
      var encrypttext = $crypthmac.encrypt(url, $scope.secret);

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
        if(response.data.status_code != 100){
          if(response.data.status_code == 206){
            Materialize.toast("Valor não permitido", 5000, 'toast-falha')
          }else{
            Materialize.toast(response.data.error_message, 5000, 'toast-falha')
          }
        }else{
          Materialize.toast("Ordem de Venda executada com sucesso!", 5000, 'toast-sucesso')
          if($scope.vendaMDLTC){
            $scope.ordemInfoLTC();
            $scope.tableOrdem1();
            $scope.transition2();
          }else if($scope.vendaMDBTC){
            $scope.ordemInfoBTC();
            $scope.tableOrdem2();
            $scope.transition2();
          }else if($scope.vendaMDBCH){
            $scope.ordemInfoBCH();
            $scope.tableOrdem3();
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

    $scope.transition0 = function () {
      $scope.tab0 = true;
      $scope.tab1 = false;
      $scope.tab2 = false;
      $scope.tab3 = false;
      $scope.tab4 = false;
      $scope.tab5 = false;
    }

    $scope.transition1 = function () {
      $scope.tab0 = false;
      $scope.tab1 = true;
      $scope.tab2 = false;
      $scope.tab3 = false;
      $scope.tab4 = false;
      $scope.tab5 = false;
    }

    $scope.transition2 = function () {
      $scope.tab0 = false;
      $scope.tab1 = false;
      $scope.tab2 = true;
      $scope.tab3 = false;
      $scope.tab4 = false;
      $scope.tab5 = false;
    }

    $scope.transition3 = function () {
      $scope.tab0 = false;
      $scope.tab1 = false;
      $scope.tab2 = false;
      $scope.tab3 = true;
      $scope.tab4 = false;
      $scope.tab5 = false;
    }

    $scope.transition4 = function () {
      $scope.tab0 = false;
      $scope.tab1 = false;
      $scope.tab2 = false;
      $scope.tab3 = false;
      $scope.tab4 = true;
      $scope.tab5 = false;
    }

    $scope.transition5 = function () {
      $scope.tab0 = false;
      $scope.tab1 = false;
      $scope.tab2 = false;
      $scope.tab3 = false;
      $scope.tab4 = false;
      $scope.tab5 = true;
    }

    $scope.tableOrdem1 = function () {
      $scope.table1 = true;
      $scope.table2 = false;
      $scope.table3 = false;
      $scope.tableTabAct1 = "tabs-select-ativo";
      $scope.tableTabAct2 = "";
      $scope.tableTabAct3 = "";
    }

    $scope.tableOrdem2 = function () {
      $scope.table1 = false;
      $scope.table2 = true;
      $scope.table3 = false;
      $scope.tableTabAct1 = "";
      $scope.tableTabAct2 = "tabs-select-ativo";
      $scope.tableTabAct3 = "";
    }

    $scope.tableOrdem3 = function () {
      $scope.table1 = false;
      $scope.table2 = false;
      $scope.table3 = true;
      $scope.tableTabAct1 = "";
      $scope.tableTabAct2 = "";
      $scope.tableTabAct3 = "tabs-select-ativo";
    }

    $scope.compraCheckBoxBTC = function () {
      $scope.compraMDLTC = false;
      $scope.compraMDBTC = true;
      $scope.compraMDBCH = false;
    }

    $scope.compraCheckBoxBCH = function () {
      $scope.compraMDLTC = false;
      $scope.compraMDBTC = false;
      $scope.compraMDBCH = true;
    }

    $scope.compraCheckBoxLTC = function () {
      $scope.compraMDLTC = true;
      $scope.compraMDBTC = false;
      $scope.compraMDBCH = false;
    }

    $scope.vendaCheckBoxBTC = function () {
      $scope.vendaMDLTC = false;
      $scope.vendaMDBTC = true;
      $scope.vendaMDBCH = false;
    }

    $scope.vendaCheckBoxBCH = function () {
      $scope.vendaMDLTC = false;
      $scope.vendaMDBTC = false;
      $scope.vendaMDBCH = true;
    }

    $scope.vendaCheckBoxLTC = function () {
      $scope.vendaMDLTC = true;
      $scope.vendaMDBTC = false;
      $scope.vendaMDBCH = false;
    }

    $scope.selectSaldoTotalCompra = function () {
      $scope.valorRealCompra = $scope.qtdRSUser;
      document.getElementById("valorReal").value = $scope.valorRealCompra;
      $scope.labelValorR$Ativado = "active";
      $scope.quantidadeMoedaCompraLTC = ($scope.valorRealCompra / $scope.mediaParaCompraNum).toFixed(8);
      $scope.quantidadeMoedaCompraBTC = ($scope.valorRealCompra / $scope.mediaParaCompraBTCNum).toFixed(8);
      $scope.quantidadeMoedaCompraBCH = ($scope.valorRealCompra / $scope.mediaParaCompraBCHNum).toFixed(8);
      $scope.labelQuantidadeMoeda = "active";
      $scope.comissaoLTCCompra = ($scope.quantidadeMoedaCompraLTC * 0.007).toFixed(8);
      $scope.comissaoBTCCompra = ($scope.quantidadeMoedaCompraBTC * 0.007).toFixed(8);
      $scope.comissaoBCHCompra = ($scope.quantidadeMoedaCompraBCH * 0.007).toFixed(8);
      $scope.labelComissao = "active";
      $scope.liquidoCompraLTC = $scope.quantidadeMoedaCompraLTC - $scope.comissaoLTCCompra;
      $scope.liquidoCompraBTC = $scope.quantidadeMoedaCompraBTC - $scope.comissaoBTCCompra;
      $scope.liquidoCompraBCH = $scope.quantidadeMoedaCompraBCH - $scope.comissaoBCHCompra;
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

    $scope.selectSaldoTotalVendaBCH = function (){
      $scope.valorRealVenda = $scope.qtdBCHUser;
      document.getElementById("valorMD").value = $scope.valorRealVenda;
      $scope.labelValorMDAtivado = "active";
      $scope.quantidadeMoedaVendaLTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraNum).toFixed(8);
      $scope.quantidadeMoedaVendaBTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraBTCNum).toFixed(8);
      $scope.quantidadeMoedaVendaBCH = (document.getElementById('valorMD').value * $scope.mediaParaCompraBCHNum).toFixed(8);
      $scope.labelQuantidadeVenda = "active";
      $scope.comissaoVendaLTC = ($scope.quantidadeMoedaVendaLTC * 0.007).toFixed(8);
      $scope.comissaoVendaBTC = ($scope.quantidadeMoedaVendaBTC * 0.007).toFixed(8);
      $scope.comissaoVendaBCH = ($scope.quantidadeMoedaVendaBCH * 0.007).toFixed(8);
      $scope.labelComissaoVenda = "active";
      $scope.liquidoVendaLTC = $scope.quantidadeMoedaVendaLTC - $scope.comissaoVendaLTC;
      $scope.liquidoVendaBTC = $scope.quantidadeMoedaVendaBTC - $scope.comissaoVendaBTC;
      $scope.liquidoVendaBCH = $scope.quantidadeMoedaVendaBCH - $scope.comissaoVendaBCH;
      $scope.labelliquidoVenda = "active";
    }

    $scope.valorInformado = function () {
      $scope.valorRealCompra = document.getElementById('valorReal').value;
      $scope.labelValorR$Ativado = "active";
      $scope.quantidadeMoedaCompraLTC = (document.getElementById('valorReal').value / $scope.mediaParaCompraNum).toFixed(8);
      $scope.quantidadeMoedaCompraBTC = (document.getElementById('valorReal').value / $scope.mediaParaCompraBTCNum).toFixed(8);
      $scope.quantidadeMoedaCompraBCH = (document.getElementById('valorReal').value / $scope.mediaParaCompraBCHNum).toFixed(8);
      $scope.labelQuantidadeMoeda = "active";
      $scope.comissaoLTCCompra = ($scope.quantidadeMoedaCompraLTC * 0.007).toFixed(8);
      $scope.comissaoBTCCompra = ($scope.quantidadeMoedaCompraBTC * 0.007).toFixed(8);
      $scope.comissaoBCHCompra = ($scope.quantidadeMoedaCompraBCH * 0.007).toFixed(8);
      $scope.labelComissao = "active";
      $scope.liquidoCompraLTC = $scope.quantidadeMoedaCompraLTC - $scope.comissaoLTCCompra;
      $scope.liquidoCompraBTC = $scope.quantidadeMoedaCompraBTC - $scope.comissaoBTCCompra;
      $scope.liquidoCompraBCH = $scope.quantidadeMoedaCompraBCH - $scope.comissaoBCHCompra;
      $scope.labelliquidoCompra = "active";
    }

    $scope.valorInformadoMD = function () {
      $scope.valorRealVenda = document.getElementById('valorMD').value;
      $scope.labelValorMDAtivado = "active";
      $scope.quantidadeMoedaVendaLTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraNum).toFixed(8);
      $scope.quantidadeMoedaVendaBTC = (document.getElementById('valorMD').value * $scope.mediaParaCompraBTCNum).toFixed(8);
      $scope.quantidadeMoedaVendaBCH = (document.getElementById('valorMD').value * $scope.mediaParaCompraBCHNum).toFixed(8);
      $scope.labelQuantidadeVenda = "active";
      $scope.comissaoVendaLTC = ($scope.quantidadeMoedaVendaLTC * 0.007).toFixed(8);
      $scope.comissaoVendaBTC = ($scope.quantidadeMoedaVendaBTC * 0.007).toFixed(8);
      $scope.comissaoVendaBCH = ($scope.quantidadeMoedaVendaBCH * 0.007).toFixed(8);
      $scope.labelComissaoVenda = "active";
      $scope.liquidoVendaLTC = $scope.quantidadeMoedaVendaLTC - $scope.comissaoVendaLTC;
      $scope.liquidoVendaBTC = $scope.quantidadeMoedaVendaBTC - $scope.comissaoVendaBTC;
      $scope.liquidoVendaBCH = $scope.quantidadeMoedaVendaBCH - $scope.comissaoVendaBCH;
      $scope.labelliquidoVenda = "active";
    }


    var tick = function() {
        var onlineLoop = navigator.onLine;
        if (!onlineLoop) {
          $('#modalOnline').modal('open');
        }else{
          if ($scope.init){
            $scope.orderBookLTCAsks = [];
            $scope.orderBookLTCBids = [];
            firebase.database().ref('/orderBookLTC').once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key.ask) {
                $scope.orderBookLTCAsks.push(key.ask[obj]);
              }
              for (var obj in key.bid) {
                $scope.orderBookLTCBids.push(key.bid[obj]);
              }
            });

            $scope.orderBookBTCAsks = [];
            $scope.orderBookBTCBids = [];
            firebase.database().ref('/orderBookBTC').once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key.ask) {
                $scope.orderBookBTCAsks.push(key.ask[obj]);
              }
              for (var obj in key.bid) {
                $scope.orderBookBTCBids.push(key.bid[obj]);
              }
            });

            $scope.orderBookBCHAsks = [];
            $scope.orderBookBCHBids = [];
            firebase.database().ref('/orderBookBCH').once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key.ask) {
                $scope.orderBookBCHAsks.push(key.ask[obj]);
              }
              for (var obj in key.bid) {
                $scope.orderBookBCHBids.push(key.bid[obj]);
              }
            });
          }

          $scope.grafico = function() {
            Chart.defaults.global.defaultFontColor = 'white';
            Chart.defaults.global.elements.line.borderWidth = 5;
            Chart.defaults.global.colors = ['rgba(0,201,126,0.2)','rgba(255,0,0,0.2)','rgba(0,153,255,0.2)'];
            $scope.labels1 = []; $scope.compra = []; $scope.venda = []; $scope.media = [];
            $scope.labels2 = []; $scope.compraBTC = []; $scope.vendaBTC = []; $scope.mediaBTC = [];
            $scope.labels3 = []; $scope.compraBCH = []; $scope.vendaBCH = []; $scope.mediaBCH = [];
            for (var i in $scope.arrayLTC) {
              $scope.labels1.push($scope.arrayLTC[i].data);
              $scope.compra.push($scope.arrayLTC[i].buy);
              $scope.venda.push($scope.arrayLTC[i].sell);
              $scope.media.push((parseFloat($scope.arrayLTC[i].buy) + parseFloat($scope.arrayLTC[i].sell))/2);
              $scope.data1 = [$scope.compra, $scope.venda, $scope.media];
            }
            for (var i in $scope.arrayBTC) {
              $scope.labels2.push($scope.arrayBTC[i].data);
              $scope.compraBTC.push($scope.arrayBTC[i].buy);
              $scope.vendaBTC.push($scope.arrayBTC[i].sell);
              $scope.mediaBTC.push((parseFloat($scope.arrayBTC[i].buy) + parseFloat($scope.arrayBTC[i].sell))/2);
              $scope.data2 = [$scope.compraBTC, $scope.vendaBTC, $scope.mediaBTC];
            }
            for (var i in $scope.arrayBCH) {
              $scope.labels3.push($scope.arrayBCH[i].data);
              $scope.compraBCH.push($scope.arrayBCH[i].buy);
              $scope.vendaBCH.push($scope.arrayBCH[i].sell);
              $scope.mediaBCH.push((parseFloat($scope.arrayBCH[i].buy) + parseFloat($scope.arrayBCH[i].sell))/2);
              $scope.data3 = [$scope.compraBCH, $scope.vendaBCH, $scope.mediaBCH];
            }
            $scope.series = ['Valor Compra', 'Valor Venda', 'Valor Média'];
            $scope.onClick = function (points, evt) {
              console.log(points, evt);
            };

            $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }];
            $scope.options = {scales: {yAxes: [{id: 'y-axis-1', type: 'linear', display: true, position: 'left'}]}};
            $scope.loading = false;
            $scope.true = false;
          }


          $scope.dadosLTC = function () {
            var date = new Date();
            var ult = ($scope.arrayLTC.length) - 1;
            var p_ult = ($scope.arrayLTC.length) - 2;
            $scope.dataAtualizacaoLTC = "Atualizado em: "+
                                        nomeMeses[date.getMonth()]+" "+
                                        date.getDate()+", "+
                                        date.getHours()+":"+
                                        date.getMinutes();
            $scope.maiorNegociacaoLTC = $filter('number')(($scope.arrayLTC[ult].high), 2)
            $scope.menorNegociacaoLTC = $filter('number')(($scope.arrayLTC[ult].low), 2)
            $scope.volumeMoedaLTC = $filter('number')(($scope.arrayLTC[ult].vol), 2)
            $scope.precoUltimoNegociadoLTC = $filter('number')(($scope.arrayLTC[ult].last), 2)
            $scope.maiorValorCompraLTC = $scope.arrayLTC[ult].buy;
            $scope.menorValorVendaLTC = $scope.arrayLTC[ult].sell;
            $scope.mediaParaCompra = (parseFloat($scope.arrayLTC[ult].buy) + parseFloat($scope.arrayLTC[ult].sell))/2;
            $scope.mediaParaCompraPast = (parseFloat($scope.arrayLTC[p_ult].buy) + parseFloat($scope.arrayLTC[p_ult].sell))/2;
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
            $scope.mediaParaCompra = "R$ "+$filter('number')(($scope.mediaParaCompra), 2)
            $scope.grafLTCInit = false;
          }

          $scope.dadosBTC = function () {
            var date = new Date();
            var ult = ($scope.arrayBTC.length) - 1;
            var p_ult = ($scope.arrayBTC.length) - 2;
            $scope.dataAtualizacaoBTC = "Atualizado em: "+
                                        nomeMeses[date.getMonth()]+" "+
                                        date.getDate()+", "+
                                        date.getHours()+":"+
                                        date.getMinutes();
            $scope.maiorNegociacaoBTC = $filter('number')(($scope.arrayBTC[ult].high), 2)
            $scope.menorNegociacaoBTC = $filter('number')(($scope.arrayBTC[ult].low), 2)
            $scope.volumeMoedaBTC = $filter('number')(($scope.arrayBTC[ult].vol), 2)
            $scope.precoUltimoNegociadoBTC = $filter('number')(($scope.arrayBTC[ult].last), 2)
            $scope.maiorValorCompraBTC = $scope.arrayBTC[ult].buy;
            $scope.menorValorVendaBTC = $scope.arrayBTC[ult].sell;
            $scope.mediaParaCompraBTC = (parseFloat($scope.arrayBTC[ult].buy) + parseFloat($scope.arrayBTC[ult].sell))/2;
            $scope.mediaParaCompraBTCPast = (parseFloat($scope.arrayBTC[p_ult].buy) + parseFloat($scope.arrayBTC[p_ult].sell))/2;

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
            $scope.mediaParaCompraBTC = "R$ "+$filter('number')(($scope.mediaParaCompraBTC), 2)
            $scope.grafBTCInit = false;
          }

          $scope.dadosBCH = function () {
            var date = new Date();
            var ult = ($scope.arrayBCH.length) - 1;
            var p_ult = ($scope.arrayBCH.length) - 2;
            $scope.dataAtualizacaoBCH = "Atualizado em: "+
                                        nomeMeses[date.getMonth()]+" "+
                                        date.getDate()+", "+
                                        date.getHours()+":"+
                                        date.getMinutes();
            $scope.maiorNegociacaoBCH = $filter('number')(($scope.arrayBCH[ult].high), 2)
            $scope.menorNegociacaoBCH = $filter('number')(($scope.arrayBCH[ult].low), 2)
            $scope.volumeMoedaBCH = $filter('number')(($scope.arrayBCH[ult].vol), 2)
            $scope.precoUltimoNegociadoBCH = $filter('number')(($scope.arrayBCH[ult].last), 2)
            $scope.maiorValorCompraBCH = $scope.arrayBCH[ult].buy;
            $scope.menorValorVendaBCH = $scope.arrayBCH[ult].sell;
            $scope.mediaParaCompraBCH = (parseFloat($scope.arrayBCH[ult].buy) + parseFloat($scope.arrayBCH[ult].sell))/2;
            $scope.mediaParaCompraBCHPast = (parseFloat($scope.arrayBCH[p_ult].buy) + parseFloat($scope.arrayBCH[p_ult].sell))/2;
            $scope.mediaParaCompraBCHNum = $scope.mediaParaCompraBCH;
            if ($scope.logado) {
              var valorReais = $scope.mediaParaCompraBCH * $scope.qtdBCHUser;
              $scope.estadoReaisBCH = "R$ "+$filter('number')((valorReais), 2);
            }
            var differenca = $scope.mediaParaCompraBCH - $scope.mediaParaCompraBCHPast;
            if (Math.sign(differenca) == -1) {
              $scope.corDiferencaBCH = {'color':'#ff0000'};
              $scope.diferencaBCH = $filter('number')((differenca), 4);
            }else if (Math.sign(differenca) == 1) {
              $scope.corDiferencaBCH = {'color':'#00C97E'};
              $scope.diferencaBCH = "+"+$filter('number')((differenca), 4);

            }else if (Math.sign(differenca) == 0) {
              $scope.corDiferencaBCH = {'color':'#87B4CE'};
              $scope.diferencaBCH = $filter('number')((differenca), 4);
            }
            var porcentagem = (differenca/$scope.mediaParaCompraBCHPast)*100
            $scope.porcentagemBCH = "("+$filter('number')((porcentagem), 2)+"%)";
            $scope.mediaParaCompraBCH = "R$ "+$filter('number')(($scope.mediaParaCompraBCH), 2)
            $scope.grafBCHInit = false;
          }

          if ($scope.grafLTCInit) {
            $scope.dadosLTC();
          }else{
            firebase.database().ref('/dadosLTC').limitToLast(1).once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key) {
                $scope.arrayLTC.shift();
                $scope.arrayLTC.push(key[obj]);
              }
              $scope.dadosLTC();
            });
          }

          if ($scope.grafBTCInit) {
            $scope.dadosBTC();
          }else{
            firebase.database().ref('/dadosBTC').limitToLast(1).once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key) {
                $scope.arrayBTC.shift();
                $scope.arrayBTC.push(key[obj]);
              }
              $scope.dadosBTC();
            });
          }

          if ($scope.grafBCHInit) {
            $scope.dadosBCH();
          }else{
            firebase.database().ref('/dadosBCH').limitToLast(1).once('value').then(function(snapshot) {
              var key = snapshot.val();
              for (var obj in key) {
                $scope.arrayBCH.shift();
                $scope.arrayBCH.push(key[obj]);
              }
              $scope.dadosBCH();
            });
          }

          $scope.grafico();
        }
        $timeout(tick, $scope.tickExecucao); // reset the timer
    }

    // Start the timer
    $timeout(tick, $scope.tickInicial);
  }
});

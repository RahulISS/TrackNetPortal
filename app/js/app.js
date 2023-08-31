angular.module('mobileWaterTrac', ['angularModalService','ui.router','app.routes','frameCtrl',
'loginCtrl','mainCtrl','homeCtrl','summaryCtrl','realTimeCtrl','overviewCtrl',
'chartsCtrl','authService','dataService','highcharts-ng','ngStorage','d3',
'settingsCtrl','imageCtrl','tracknetCtrl']).config(function($provide) {
    // for local
    //  $provide.constant('apiBaseUrl', 'http://127.0.0.1:8000/api/v1/'); 
    // for live
   $provide.constant('apiBaseUrl', 'https://dev-api-sg.tracwater.asia/api/v1/');
});

angular.module('mobileWaterTrac', ['angularModalService', 'ui.router', 'app.routes', 'frameCtrl', 'loginCtrl', 'mainCtrl', 'homeCtrl', 'summaryCtrl', 'realTimeCtrl', 'overviewCtrl', 'chartsCtrl', 'authService', 'dataService', 'highcharts-ng', 'ngStorage', 'd3', 'settingsCtrl', 'imageCtrl', 'tracknetCtrl']).config(function ($provide) {
    $provide.constant('portalId', '64ad1af2664396439a286273');
    //for local
    $provide.constant('apiBaseUrl', 'http://127.0.0.1:8000/api/v1/');
    //for live
    //$provide.constant('apiBaseUrl', 'https://dev-api.infoasaservice.net.au/api/v1/');
});
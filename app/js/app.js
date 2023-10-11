angular.module(
    'mobileWaterTrac', [
    'angularModalService',
    'ui.router',
    'app.routes',
    'frameCtrl',
    'loginCtrl',
    'mainCtrl',
    'authService',
    'dataService',
    'highcharts-ng',
    'ngStorage'
]).config(function ($provide) {
    // for local
    // $provide.constant('apiBaseUrl', 'http://127.0.0.1:8000/api/v1/'); 
    // for live
    $provide.constant('apiBaseUrl', 'https://dev-api-sg.tracwater.asia/api/v1/');
    // for production
    // $provide.constant('apiBaseUrl', 'https://api-sg.tracwater.asia/api/v1/');
});

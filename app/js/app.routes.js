angular.module('app.routes', [])

	.config(function($stateProvider, $urlRouterProvider) {

    //If no valid url->open frame
    $urlRouterProvider.otherwise('/login');

		$stateProvider

		.state('login', {
				url: '/login',
				templateUrl: 'pages/login.html',
				controller: 'loginController'
		})

		.state('main', {
				url: '/main',
				templateUrl: 'pages/main.html',
				controller: 'mainController'
		})

		.state('main.home', {
				url: '/home',
				templateUrl: 'pages/home.html',
				controller: 'homeController'
		})

		.state('main.realtime', {
				url: '/realtime',
				templateUrl: 'pages/real_time_view.html',
				controller: 'realTimeController'
		})

		.state('main.summary', {
				url: '/summary',
				templateUrl: 'pages/summary.html',
				controller: 'summaryController'
		})

		.state('main.overview', {
				url: '/overview',
				templateUrl: 'pages/overview.html',
				controller: 'overviewController'
		})

	

		.state('main.charts', {
			url: '/charts',
			templateUrl: 'pages/charts.html',
			controller: 'chartsController'
		})

		.state('main.vision', {
			url: '/vision',
			templateUrl: 'pages/image.html',
			controller: 'imageController'
		})


		.state('main.comparison', {
			url: '/comparison',
			templateUrl: 'pages/comparison.html',
			controller: 'comparisonController'
		})

		.state('main.tracnet', {
			url: '/tracnet',
			templateUrl: 'pages/tracknet.html',
			controller: 'tracknetController'
		})

		.state('main.settings', {
			url: '/settings',
			templateUrl: 'pages/settings.html',
			controller: 'settingsController'
		})

		.state('main.installations', {
			url: '/installations',
			templateUrl: 'pages/installations.html',
			controller: 'installationsController'
		})

		.state('main.download',{
			url: '/download',
			templateUrl: 'pages/download.html',
			controller: 'downloadController'
		});

});
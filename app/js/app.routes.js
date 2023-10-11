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
		});

		

});

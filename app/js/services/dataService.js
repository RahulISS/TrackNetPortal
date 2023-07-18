angular.module('authService', [])

.factory('Auth', function($http) {

	var authFactory = {};

	authFactory.skySparkAuthentication = function(username,password) {
		return $http.post('php/loginLegacy.php',{ 'username' : username , 'password' : password })
	};

	return authFactory;

});

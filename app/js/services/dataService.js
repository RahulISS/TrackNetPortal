angular.module('authService', [])

.factory('Auth', function($http) {

	var authFactory = {};

	authFactory.skySparkAuthentication = function(username,password,skysparkVersion) {
		if( skysparkVersion === 2 ){
			return $http.post('php/loginLegacy.php',{ 'username' : username , 'password' : password })
		}else{
			return $http.post('php/login.php',{ 'username' : username , 'password' : password })
		}	
	};

	return authFactory;

});

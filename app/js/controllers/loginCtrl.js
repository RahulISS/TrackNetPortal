angular.module('loginCtrl', []).controller('loginController', function ($scope, $rootScope, $sessionStorage, $http, portalId, apiBaseUrl, $state,) {
  $scope.thisyear = new Date().getFullYear();
  $rootScope.storage = $sessionStorage.$default({
    isOzgreen: null,
    userRole: null,
    authToken: false,
    skysparkVersion: null,
  });
  $scope.username = null;
  $scope.password = null;
  $scope.doLogin = function () {
    $scope.loginerror = null;
    $rootScope.storage.username = $scope.username;
    var loginData = {
      portalId: portalId,
      username: $scope.username,
      password: $scope.password
    };
    // Make an HTTP POST request to the login API endpoint
    $http.post(apiBaseUrl + 'login', loginData).then(function (response) {
      // Handle the response from the server
      response.headers('Cache-Control', 'no-cache, no-store, must-revalidate');
      var data = response.data;
      if (data) {
        localStorage.setItem("authToken", data.data.token);
        $rootScope.storage.loggedIn = data.status;
        $state.go('main');
      } else {
        // Login failed
        $scope.loginError = 'Invalid username or password';
      }
    }).catch(function (error) {
      // Handle error if the API request fails
      //onsole.log(error, 'error');
      $scope.loginError = 'Invalid username or password';
    });
  };
});
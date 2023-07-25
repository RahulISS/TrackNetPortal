angular.module('loginCtrl', [])
  .controller('loginController', function ($scope, $http, $rootScope, $state,apiBaseUrl) {
    $scope.serverRequest = apiBaseUrl;
    $scope.doLogin = function () {
      // Create an object with the login credentials
      var loginData = {
        username: $scope.username,
        password: $scope.password
      };

      // Make an HTTP POST request to the login API endpoint
      $http.post($scope.serverRequest+'login', loginData)
        .then(function (response) {
          // Handle the response from the server
          var data = response.data;
          if (data) {
            localStorage.setItem("loginToken", data.data.token);
            $rootScope.storage.loggedIn = data.success;
            $state.go('main');
          } else {
            $scope.loginError = 'Invalid username or password';
          }
        })
        .catch(function (error) {
          $scope.loginError = 'Invalid username or password';
        });
    };
  });

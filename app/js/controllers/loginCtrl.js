angular.module('loginCtrl', [])
  .controller('loginController', function ($scope, $http, $rootScope, $state, apiBaseUrl) {
    $scope.doLogin = function () {
      // Create an object with the login credentials
      var loginData = {
        username: $scope.username,
        password: $scope.password
      };

      // Make an HTTP POST request to the login API endpoint
      $http.post(apiBaseUrl+`login`, loginData)
        .then(function (response) {
          // Handle the response from the server
          var data = response.data;
          if (data) {
            localStorage.setItem('loggedIn',data.status);
            localStorage.setItem('authToken', data.data.token);
            $rootScope.storage.loggedIn = data.status;
            $state.go('main');
          } else {
            // Login failed
            $scope.loginError = data.message;
          }
        })
        .catch(function (error) {
          // Handle error if the API request fails
          // console.log(error.data.message, 'error');
          $scope.loginError = error.data.message;
        });
    };
  });


angular.module('apiSerice', [])

// Step 3: Create a service
app.factory('apiService', ['$http', function($http) {
    var apiBase = '/api/'; // Set your Laravel API base URL here
  
    return {
      getItems: function() {
        return $http.get(apiBase + 'items');
      },
      createItem: function(itemData) {
        return $http.post(apiBase + 'items', itemData);
      },
      updateItem: function(itemId, itemData) {
        return $http.put(apiBase + 'items/' + itemId, itemData);
      },
      deleteItem: function(itemId) {
        return $http.delete(apiBase + 'items/' + itemId);
      }
    };
  }]);

angular.module('dataService', [])

.factory('Data', function($http,$rootScope,$q) {

	var dataFactory = {}, httpRequestCanceller = [];

	dataFactory.sendRequest = function(query,skysparkVersion){
		var canceler = $q.defer();
		httpRequestCanceller[httpRequestCanceller.length] = canceler;
		if( skysparkVersion === 2 ){
			return $http.post('php/getDataLegacy.php',{ 'query' : query , 'token' : $rootScope.storage.authToken },{timeout: canceler.promise})
		}else{
			return $http.post('php/getData.php',{ 'query' : query , 'cookie' : $rootScope.storage.authToken },{timeout: canceler.promise})
		}
	}

	dataFactory.generatePdf = function(query,options,skysparkVersion){
		var canceler = $q.defer();
		httpRequestCanceller[httpRequestCanceller.length] = canceler;
		if( skysparkVersion === 2 ){
			if(options.caseType == 1) {
				return $http.post('php/pdfDataLegacy.php',{ 'options': options, 'query' : query , 'token' : $rootScope.storage.authToken },{timeout: canceler.promise, responseType: 'arraybuffer' });
			} else {
				return $http.post('php/pdfDataLegacy.php',{ 'options': options, 'query' : query , 'token' : $rootScope.storage.authToken },{timeout: canceler.promise });
			}
		}
	}

	dataFactory.cancelRequest = function() {
		for (var i = 0; i < httpRequestCanceller.length; i++) {
		 	httpRequestCanceller[i].resolve();
		}
	}

	return dataFactory;
});

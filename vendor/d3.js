angular.module('d3', [])
	.factory('d3Service', ['$document', '$window', '$q', '$rootScope',
		function ($document, $window, $q, $rootScope) {
			var d = $q.defer(),
				d3service = {
					d3: function () {
						return d.promise;
					}
				};

			function onScriptLoad() {
				$rootScope.$apply(function () {
					d.resolve($window.d3);
				});
			}
			var scriptTag = $document[0].createElement('script');
			scriptTag.type = 'text/javascript';
			scriptTag.async = true;
			scriptTag.src = 'https://d3js.org/d3.v6.min.js';
			scriptTag.onreadystatechange = function () {
				if (this.readyState == 'complete') onScriptLoad();
			}
			scriptTag.onload = onScriptLoad;
			var s = $document[0].getElementsByTagName('body')[0];
			s.appendChild(scriptTag);
			return d3service;
		}
	]);
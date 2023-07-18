angular.module('realTimeCtrl', [])

	.controller('realTimeController', function ($scope, $rootScope, Data, $interval, $timeout) {

		$scope.viewType = '';

		$scope.kioskTreeData = $rootScope.storage.treeData;
		if( $scope.kioskTreeData.length > 0 ){
			$timeout(function(){
				$scope.$broadcast('treekioskready');
			},100)
		}

		$rootScope.$watch('storage.treeData',function(newVal,oldVal){
			if( (newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal) ) return;
			$scope.kioskTreeData = newVal;
			$scope.$broadcast('treekioskready');
		});

		const ids = ['@2935d41c-7324eca5','@2935f24d-9ab66a0b'];
		let endInterval = null;

		$scope.idsInterval = function(){
			if(endInterval) return;
			endInterval = $interval(function(){
				if(!$scope.selected){
					$timeout(function(){
						$('#kioskTree').jstree("select_node",'@2935d41c-7324eca5');
					});	
				}else{			
					const selectedId = $scope.selected.id;
					let currentIndex = ids.indexOf(selectedId);
					$timeout(function(){
						$('#kioskTree').jstree("deselect_node",selectedId);
						if(currentIndex < 1){
							currentIndex++;
						}else if(currentIndex === 1){
							currentIndex = 0;
						}
						$timeout(function(){
							$('#kioskTree').jstree("select_node",ids[currentIndex]);
						});
					});
				}
			},20_000);
		}

		$scope.$watch('selected',function(newVal){
			timeoutArray.forEach(function(timeout){
       			$timeout.cancel(timeout);    
   			});
			if( typeof newVal === 'undefined' || newVal === null ){
				$scope.viewType = '';
				return;
			}
			$scope.cancelIdsInterval();
			$scope.idsInterval();
			selectType(newVal);
		});

		$scope.cancelIdsInterval = function(){
			if (endInterval) {
            	$interval.cancel(endInterval);
            	endInterval = null;
          	}
		}

		$scope.batteryAndSingal = {
			"battery_text": null,
			"battery_measurement": null,
			"battery_text_colour": null,
			"signalStrength_text": null,
			"signalStrength_measurement": null,
			"signalStrength_text_colour": null
		}
		
		function selectType(node){
			$scope.viewType = 'flow';
			handleFlow(node);
		}

		function handleFlow(node){
			$scope.sewerReadings(node.id);
			sewerChart(node.id);
		}

		function sewerChart(id){
			$scope.sewerChartConfig.series[0].data = [];
			const query = `html_plot_chart_thresholds_01_a([{aTreeNodeRef:${id},aSensorTypeRef:read(aSensorType and id_name == "Level")->id}],now()-6hr..now(),"actual",1min,[900mm],"Brisbane")`;
			Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function(response){
				const data = response.data.rows;
				let flowDepth = [];
				let pipeDiameter = [];
				let animationData = [];
				for (let i = 0; i < data.length; i++) {
					const timestamp = moment.utc(data[i].ts.split(" "), "YYYY-MM-DD HH:mm:ss").valueOf();
					if ( typeof data[i].v0 !== 'undefined' ) {
						const values = [timestamp, parseFloat(data[i].v0)];
						flowDepth.push(values);
						animationData.push( ( data[i].v0 ).toFixed(2) );
					}
					if( typeof data[i].v1 !== 'undefined' ){
						const values = [timestamp, parseFloat(data[i].v1)];
						pipeDiameter.push(values)
					}
				}
				$scope.pipeDiameter =  parseFloat(data[0].v1);
				$scope.sewerChartConfig.series[0].data = flowDepth;
				$scope.sewerChartConfig.series[1].data = pipeDiameter;
				startAnimationCycle(animationData);	
				$timeout(function () {
					try {
						$scope.$broadcast('highchartsng.reflow');
					} catch (ex) {
						console.log('Chart config not ready.');
					}
				}, 100);
			})
		}

		let timeoutArray = [];
		$scope.depthValue = 0;
		function startAnimationCycle(depthArray){
			let lastIndex = depthArray.length - 1;
			for(let i = 0; i < depthArray.length; i++){
				let animationTimeout = $timeout(function(){
					$scope.depthValue = depthArray[i];
					if(i === lastIndex){
						getChartData($scope.currentSelected.name);
					}
				},i * 500);
				timeoutArray.push(animationTimeout);
			}	
		}

		$scope.sewerReadings = function(id) {
			const query = `html_aTreeNode_hisEndVal_02_a(${id})`;
			Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function (response) {
				const data = response.data.rows;
				for(let i = 0; i < data.length; i++){
					if(data[i].id_name === 'Volumetric Flow Rate'){
						if( $scope.flowRate !== parseFloat(data[i].hisEndVal) ){
							$("#flowRateCircle").css("background-color", "rgba(255,255,102,0.5)");
							$timeout(function(){
								$("#flowRateCircle").css("background-color", "#FFFFFF");
							},500);
						}
						$scope.flowRate = parseFloat(data[i].hisEndVal);
						$scope.flowRateUnit = data[i].unit;
					}
					if(data[i].id_name === 'Velocity'){
						if( $scope.flowVelocity !== parseFloat(data[i].hisEndVal) ){
							$("#flowFelocityCircle").css("background-color", "rgba(255,255,102,0.5)");
							$timeout(function(){
								$("#flowFelocityCircle").css("background-color", "#FFFFFF");
							},500);
						}
						$scope.flowVelocity = parseFloat(data[i].hisEndVal);
						$scope.flowVelocityUnit = data[i].unit;
					}	
				}
			});
		}

		$scope.$on('$destroy', function() {
			timeoutArray.forEach(function(timeout){
       			$timeout.cancel(timeout);    
   			});
			$scope.cancelIdsInterval();
		});

		$scope.sewerChartConfig = {
			options: {
				exporting: {
					enabled: false
				},
				tooltip: {
					shared: true,
					formatter: function(){
						return tooltipFormaterFunction(this,"number",null);
					}
				},
				chart: {
					zoomType: "xy"
				},
				yAxis: [{
					title: {
						text: 'Flow depth(mm)'
					},
					min: 0,
					max: null,
					endOnTick: false,
					gridLineWidth: 1,
					lineWidth: 1,
					labels: {
						format: ' {value}',
					},
				}],
				xAxis: {
					type: 'datetime',
					minPadding: 0,
					maxPadding: 0,
					tickInterval: null,
					gridLineWidth: 1,
				},
				legend: {
					enabled: true
				},
				credits: {
					enabled: false
				}
			},
			series: [
				{
					marker: {
						enabled: false
					},
					type: "line",
					color: "#1e90ff",
					name: 'Flow Depth (mm)',
					data: []
				},
				{
					marker: {
						enabled: false
					},
					type: "line",
					color:'#dc143c',
					dashStyle: 'ShortDash',
                    name: 'Pipe Diameter',
					data: []
				}
			],
			title: {
				text: ""
			}
		};
		
	})

	.directive('jstreekiosk', function () {
		return {
			restrict: 'A',
			link: function (scope, element) {
				scope.$on("treekioskready", function (event, data) {
					$(element).jstree({
							"core": {
								'check_callback': true,
								"multiple": false,
								"themes": {
									"name": "default",
									"dots": false,
									"icons": false
								},
								"data": scope.kioskTreeData
							},
							"checkbox": {
								"three_state": true
							},
							"plugins": ["search", "checkbox"]
						}, false)
						.bind("loaded.jstree", function (event, data) {
							$(this).jstree("open_all");							
							$(this).jstree("select_node",['@29cd0ed2-43b2f4dc'],true);
                            $(this).jstree("disable_node",['@29cd0ed2-43b2f4dc'],true);
						})
						.bind('select_node.jstree', function (e, data) {
							scope.selected = data.node.original;
							scope.$apply();
						})
						.bind('deselect_node.jstree', function (e, data) {
							scope.selected = null;
							scope.$apply();
						})
				});
			}
		};
	})

  	.directive('sewerManhole', function ($window, d3Service) {
		return {
			restrict: 'EA',
			scope: {
				value: '=',
				diameter: '='
			},
			link: function (scope, element, attrs) {

				d3Service.d3().then(function (d3) {

					let svg = d3.select(element[0])
						.append("svg")
						.style('width', '100%')
						.style('height', '100%');

					let width;
					let height;
					
					$window.onresize = function () {
                		scope.$apply();
					};
					
					scope.$watch(function () {
						return angular.element($window)[0].innerWidth;
					}, function () {
						scope.render(scope.value,scope.diameter);   
					});
					
					scope.render = function(data) {

						let dimensions = {
							margin: {
								top: 70,
								bottom: 70,
								left: 50,
								right: 100,
							},
						}

						svg.selectAll('*').remove();
						height = element.height();
						width = element.width();

						let yScale = d3.scaleLinear()
							.domain([attrs.min, attrs.max])
							.range([height - dimensions.margin.top - dimensions.margin.bottom, 0 ]);

						svg.append('rect')
							.attr('height', height - dimensions.margin.top - dimensions.margin.bottom )
							.attr('width', width - dimensions.margin.left - dimensions.margin.right )
							.attr('x', dimensions.margin.left  )
							.attr('y', dimensions.margin.top )
							.attr('stroke-width', 2)
							.attr('stroke', '#000000')
							.attr('fill','transparent');

						const valueRect = yScale(scope.value);
						const valueTick = yScale(scope.diameter);
						if( (height - dimensions.margin.bottom - dimensions.margin.top - valueRect - 2) < 0 ){
							return;
						}
						svg.append('rect')
							.attr('width', width - dimensions.margin.left - dimensions.margin.right - 4 )
							.attr('x', dimensions.margin.left + 2  )
							.attr('height', height - dimensions.margin.bottom - dimensions.margin.top - valueRect - 2 )
							.attr('y', dimensions.margin.top + valueRect )
							.attr('stroke-width', 1)
							.attr('fill','rgba(255,0,0,1)');
						
						if( (height - dimensions.margin.bottom - dimensions.margin.top - valueRect - 2) > 40 ){
							svg.append('text')
								.attr("x", width - dimensions.margin.right - 25 - ( ( width - dimensions.margin.left - dimensions.margin.right ) ) / 2 )
								.attr("y", dimensions.margin.top + valueRect + 20  )
								.attr('font-size',"16")
								.text(scope.value + 'm')
								.style("fill", "#FFFFFF");
						}else{
							svg.append('text')
								.attr("x", width - dimensions.margin.right - 25 - ( ( width - dimensions.margin.left - dimensions.margin.right ) ) / 2 )
								.attr("y", dimensions.margin.top + valueRect - 5  )
								.attr('font-size',"16")
								.text(scope.value + 'm')
								.style("fill", "#000000");
						}
					
						svg.append('line')
							.attr("x1", width - dimensions.margin.right + 2 )
							.attr("x2", width - dimensions.margin.right + 12 )
							.attr("y1", dimensions.margin.top + valueTick )
							.attr("y2", dimensions.margin.top + valueTick )
							.attr("stroke-width", 2)
							.attr("stroke", "#000000");
						
						svg.append('text')
							.attr("x", width - dimensions.margin.right + 5 )
							.attr("y", height - dimensions.margin.bottom + 5 )
							.attr('font-size',"16")
							.text('0m');
											
						svg.append('text')
							.attr("x", width - dimensions.margin.right + 15 )
							.attr("y", dimensions.margin.top + valueTick + 4 )
							.attr('font-size',"16")
							.text(scope.diameter + 'm');

						svg.append('text')
							.attr("x", width - dimensions.margin.right + 5 )
							.attr("y", dimensions.margin.top + 7 )
							.attr('font-size',"16")
							.text('3.75m');
											
												
					}

					scope.$watch('value', function(){
        				scope.render(scope.value);
            		}, true);

				});

			}
		};
	});

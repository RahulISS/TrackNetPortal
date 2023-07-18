angular.module('summaryCtrl', [])

	.controller('summaryController', function ($scope, $rootScope,Data,$timeout,$q,$interval) {

		$scope.summaryTreeData = $rootScope.storage.treeData;
		if( $scope.summaryTreeData.length > 0 ){
			$timeout(function(){
				$scope.$broadcast('treesummaryready');
			},100)
		}

		$rootScope.$watch('storage.treeData',function(newVal,oldVal){
			if( newVal == undefined ) return;
            if( oldVal == undefined ) return;
			if( (newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal) ) return;
			$scope.summaryTreeData = newVal;
			$scope.$broadcast('treesummaryready');
		});
		$rootScope.$watch('storage.sensorData',function(newVal,oldVal){
			if( newVal == undefined ) return;
            if( oldVal == undefined ) return;
			if( (newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal) ) return;
			if(!$scope.$$phase) $scope.$apply();
		});
		$scope.selectedSensors = [];

		// Weeksdays Start
        $scope.weekdays = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
        $scope.availableWeekdays = {};
        for (var i = 0; i < $scope.weekdays.length; i++) {
            $scope.availableWeekdays[$scope.weekdays[i]] = true;
        }

        function updateSeriesData(chartDataArray)
        {
        	var weekData = [];
            for(var k = 0; k < chartDataArray.length; k++) {
                var currWday = moment.utc(chartDataArray[k][0]).format('ddd').toUpperCase();
                if($scope.availableWeekdays[currWday] == true) {
                    weekData.push(chartDataArray[k]);
                }
            }
            return weekData;
        }

        $scope.toogleWeekDays = function (weekday) {
            $scope.availableWeekdays[weekday] = !$scope.availableWeekdays[weekday];
            for (var i = 0; i < $scope.activeChartsArray.length; i++) {
            	for (var j = 0; j < $scope.activeChartsArray[i].data.length; j++) {
            		$scope.activeChartsArray[i].config.series[j].data = updateSeriesData($scope.activeChartsArray[i].data[j]);
	            }
            }
        };
        // Weeksdays End

		$scope.changeMeasurement = function (sensor) {
			sensor.checked = !sensor.checked;
			if(sensor.checked) $scope.selectedSensors.push(sensor.id);
			else {
				var selectedSensors = $scope.selectedSensors, newSelectedSensors = [];
				for (var i = 0; i < selectedSensors.length; i++) {
					if(sensor.id!=selectedSensors[i]) newSelectedSensors.push(selectedSensors[i]);
				}
				$scope.selectedSensors = newSelectedSensors;
			}
			$scope.selectedCount = 0;
			for (var i = 0; i < $scope.availableSensors.length; i++) {
				if($scope.availableSensors[i].checked === true){
					$scope.selectedCount++;
				}
			}
			return $scope.selectedCount;
		};

        $scope.chartNumbersChange = function () {
            $scope.activeChartsArray = [];
			if( !$scope.availableSensors ) return;
			for (let i = 0; i < $scope.availableSensors.length; i++) {
				if ( $scope.availableSensors[i].checked === true ) {
					$scope.activeChartsArray.push({
						sensorTypeRef: $scope.availableSensors[i].id.split(" ")[0],
						isVisible: true,
						measurementText: $scope.availableSensors[i].id_name,
						divId: $scope.availableSensors[i].id_name.replaceAll(" ","").toLowerCase(),
						unit: $scope.availableSensors[i].unit,
						sensorType: $scope.availableSensors[i].kind,
						trendIndex: 0,
						type: 'actual',
						config: [],
						data: []
					});
				}
			}
			$timeout(function () {
				$(window).resize();
			}, 150);
			$scope.cancelInterval();
			$scope.startInterval();
		}

		$scope.loading = false;

		$scope.colorArray = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#000000'];

		$scope.meterVisible = [];
		$scope.activeChartsArray = [];

		$scope.returnColor = function ($index) {
			if (parseInt($index + 1) > 10) {
				let number = $index + 1;
				return 'meterColor' + number.toString()[1];
			} else {
				return 'meterColor' + parseInt($index + 1);
			}
		}

		$scope.chartArrayConfig = [];
		$scope.numChart = 0;
		$scope.numMeasure = 0;

		$scope.queryTypeActual = true;
		$scope.queryTypeTrend = false;

		$scope.switchType = function (type) {
			if (type == 'actual') {
				$scope.queryTypeActual = true;
				$scope.queryTypeTrend = false;
				for (i = 0; i < $scope.activeChartsArray.length; i++) {
					$scope.activeChartsArray[i].type = 'actual';
					$scope.activeChartsArray[i].trendIndex = 0;
				}
			} else {
				$scope.queryTypeActual = false;
				$scope.queryTypeTrend = true;
				for (i = 0; i < $scope.activeChartsArray.length; i++) {
					$scope.activeChartsArray[i].type = $scope.typeTrend[$scope.activeChartsArray[i].trendIndex].value;
				}
			}
			$scope.cancelInterval();
			$scope.startInterval();
		}

		$scope.typeTrend = [{
				text: 'Avg.',
				value: 'avg'
			},
			{
				text: 'Max.',
				value: 'max'
			},
			{
				text: 'Min.',
				value: 'min'
			},
		];

		$scope.changeType = function (index) {
			if ($scope.activeChartsArray[index].trendIndex >= 0 && $scope.activeChartsArray[index].trendIndex < 2) {
				$scope.activeChartsArray[index].trendIndex++;
			} else {
				$scope.activeChartsArray[index].trendIndex = 0;
			}
			$scope.activeChartsArray[index].type = $scope.typeTrend[$scope.activeChartsArray[index].trendIndex].value
			$scope.cancelInterval();
			$scope.startInterval();
		}

		$scope.intervalFilter = [{
				name: '5 min',
				value: '5min'
			},
			{
				name: '10 min',
				value: '10min'
			},
			{
				name: '15 min',
				value: '15min'
			},
			{
				name: '30 min',
				value: '30min'
			},
			{
				name: '1 hour',
				value: '1hr'
			},
			{
				name: '3 hours',
				value: '3hr'
			},
			{
				name: '6 hours',
				value: '6hr'
			},
			{
				name: '12 hours',
				value: '12hr'
			},
			{
				name: '1 day',
				value: '1day'
			},
			{
				name: '1 week',
				value: '1wk'
			},
			{
				name: '1 year',
				value: '1yr'
			}
		];
		$scope.selectedItem = $scope.intervalFilter[4];

		$scope.interval = null;
		$scope.intervalMessage = '';

		var summaryDatePickerFormat = "D/MM/YYYY";
		var skysparkDateFormat = "YYYY-MM-DD";

		$scope.datespan = moment($rootScope.storage.summary_startDate).format(skysparkDateFormat) + ".." + moment($rootScope.storage.summary_endDate).format(skysparkDateFormat);

		$('#summaryDateRange').daterangepicker({
				dateLimit: {
					years: 5
				},
				showDropdowns: false,
				timePicker: false,
				timePickerIncrement: 1,
				timePicker12Hour: true,
				startDate: moment($rootScope.storage.summary_startDate),
				endDate: moment($rootScope.storage.summary_endDate),
				ranges: {
					'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
					'Today': [moment(), moment()],
					'Last 7 Days': [moment().subtract('days', 7), moment()],
					'Last Week': [moment().subtract('week', 1).startOf('week'), moment().subtract('week', 1).endOf('week')],
					'This Week': [moment().startOf('week'), moment().endOf('week')],
					'Last 30 Days': [moment().subtract('days', 29), moment()],
					'This Month': [moment().startOf('month'), moment().endOf('month')],
					'Last Month': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
				},
				opens: 'right',
				buttonClasses: ['btn btn-default'],
				applyClass: 'btn-small btn-primary',
				cancelClass: 'btn-small',
				locale: {
					applyLabel: 'Submit',
					fromLabel: 'From',
					toLabel: 'To',
					customRangeLabel: 'Custom Range',
					daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
					monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
					firstDay: 1
				}
			},
			function (start, end) {
				if (start.isSame(end, "day")) $('#summaryDateRange span').html(start.format(summaryDatePickerFormat));
				else $('#summaryDateRange span').html(start.format(summaryDatePickerFormat) + ' - ' + end.format(summaryDatePickerFormat));
				$rootScope.storage.summary_startDate = start;
				$rootScope.storage.summary_endDate = end;
				$scope.datespan = moment($rootScope.storage.summary_startDate).format(skysparkDateFormat) + ".." + moment($rootScope.storage.summary_endDate).format(skysparkDateFormat);
				$scope.adjustInterval($rootScope.storage.summary_startDate, $rootScope.storage.summary_endDate);
				$scope.cancelInterval();
				$scope.startInterval();
			});

		$('#summaryDateRange span').html(moment($rootScope.storage.summary_startDate).format(summaryDatePickerFormat) + " - " + moment($rootScope.storage.summary_endDate).format(summaryDatePickerFormat));

		$scope.changeDateRange = function (direction) {
			//one day
			if ( moment($rootScope.storage.summary_endDate).isSame(moment($rootScope.storage.summary_startDate), "day")) {
				if (direction == "left") {
					$rootScope.storage.summary_startDate = moment($rootScope.storage.summary_startDate).subtract(1, "day");
					$rootScope.storage.summary_endDate = moment($rootScope.storage.summary_endDate).subtract(1, "day");
				} else {
					$rootScope.storage.summary_startDate = moment($rootScope.storage.summary_startDate).add(1, "day");
					$rootScope.storage.summary_endDate = moment($rootScope.storage.summary_endDate).add(1, "day");
				}
				$scope.datespan = moment($rootScope.storage.summary_startDate).format(skysparkDateFormat) + ".." + moment($rootScope.storage.summary_endDate).format(skysparkDateFormat);
				$('#summaryDateRange span').html($rootScope.storage.summary_startDate.format(summaryDatePickerFormat));
			} else { //more than one day
				var tempdiff = moment($rootScope.storage.summary_endDate).diff($rootScope.storage.summary_startDate, 'days');
				if (direction == "left") {
					$rootScope.storage.summary_startDate = moment($rootScope.storage.summary_startDate).subtract(tempdiff, "day");
					$rootScope.storage.summary_endDate = moment($rootScope.storage.summary_endDate).subtract(tempdiff, "day");
				} else {
					$rootScope.storage.summary_startDate = moment($rootScope.storage.summary_startDate).add(tempdiff, "day");
					$rootScope.storage.summary_endDate = moment($rootScope.storage.summary_endDate).add(tempdiff, "day");
				}
				$scope.datespan = moment($rootScope.storage.summary_startDate).format(skysparkDateFormat) + ".." + moment($rootScope.storage.summary_endDate).format(skysparkDateFormat);
				$('#summaryDateRange span').html($rootScope.storage.summary_startDate.format(summaryDatePickerFormat) + ' - ' + $rootScope.storage.summary_endDate.format(summaryDatePickerFormat));
			}
			$scope.cancelInterval();
			$scope.startInterval();
		};

		$scope.adjustInterval = function (start, end) {
			var hoursDiff = moment(end).diff(moment(start), 'hours');
			if (hoursDiff <= 72) { //Lesser than 3 days
				$scope.selectedItem = $scope.intervalFilter[0];
			} else if (hoursDiff <= 168 && hoursDiff > 72) { //Lesser 7 days
				$scope.selectedItem = $scope.intervalFilter[4];
			} else if (hoursDiff <= 768 && hoursDiff > 168) { //Lesser 32 days
				$scope.selectedItem = $scope.intervalFilter[5];
			} else if (hoursDiff <= 1512 && hoursDiff > 768) { //Lesser 63 days
				$scope.selectedItem = $scope.intervalFilter[8];
			} else if (hoursDiff <= 8760 && hoursDiff > 1512) { //Lesser 1 year
				$scope.selectedItem = $scope.intervalFilter[9];
			} else if (hoursDiff > 8760) { //Greater 1 year
				$scope.selectedItem = $scope.intervalFilter[9];
			}
			$scope.intervalMessage = 'An optimum data interval is applied. A shorter interval may require a long loading time.';
			$scope.$apply();
		}

		$scope.manualIntervalChange = function () {
			$scope.intervalMessage = '';
			$scope.cancelInterval();
			$scope.startInterval();
		}

		$scope.selectedIDs = [];

		$scope.$watch("temp_meters", function (newValue) {
			if (typeof newValue === "undefined") return;
			$scope.selectedIDs = [];
			$scope.meterVisible = [];
			for (let id of newValue) {
				let node = getTreeNode("#summaryTree", id);
				$scope.meterVisible.push(true);
				if (node.children.length === 0) {
					$scope.selectedIDs.push({
						id: node.original.id,
						text: node.original.text,
                        sensors: node.original.sensors
					});
				}
			}
			$scope.numMeter = $scope.selectedIDs.length;

			//$scope.availableSensors = JSON.parse(JSON.stringify($rootScope.storage.sensorData));
			const query3 = 'readAll(aPortalSensorType and aPortalRef->id_name == "TracNet Master Network").sort("rank").map(row => set(row,"sensor",row->aSensorTypeRef->id_name))';
			let sensors = [];
            Data.sendRequest(query3,$rootScope.storage.skysparkVersion).then(function(response){
                const data = response.data.rows;
                var sensId = '';
                for( let i = 0; i < data.length; i++){
                	sensId = data[i].aSensorTypeRef.split(" ")[0];
                	sensors.push({
                        'id': sensId,
                        'unit': data[i].unit,
                        'id_name': data[i].sensor,
                        'rank': data[i].rank,
                        'checked': $scope.selectedSensors.includes(sensId),
                    })
                }
                $scope.availableSensors = sensors;
            });
			
            $timeout(function () {
				$(window).resize();
			}, 100);
			$scope.chartNumbersChange();
		});

		function loadData(){
			if ($scope.activeChartsArray.length > 0 && $scope.numMeter > 0) {
				let list_of_meters_selected = '';
				for (let i = 0; i < $scope.selectedIDs.length; i++) {
					if (i < $scope.selectedIDs.length - 1) {
						list_of_meters_selected += $scope.selectedIDs[i].id + ',';
					} else {
						list_of_meters_selected += $scope.selectedIDs[i].id;
					}
				}

				$scope.queriesArray = [];

				for (let i = 0; i < $scope.activeChartsArray.length; i++) {
					$scope.activeChartsArray[i].data = [];
					$scope.activeChartsArray[i].config = [];
					const query = `html_plot_chart_06_b([${list_of_meters_selected}],read( aSensorType and id_name =="${$scope.activeChartsArray[i].measurementText}")->id,${$scope.datespan},"${$scope.activeChartsArray[i].type}", ${ $scope.selectedItem.value} )`;
					$scope.queriesArray.push(query);
				}
				var promises_data = $scope.queriesArray.map(function (item) {
					return Data.sendRequest(item,$rootScope.storage.skysparkVersion)
				})
				var data_completion = $q.all(promises_data)
				data_completion.then(function (responses) {
					for (let x = 0; x < responses.length; x++) {
						var colorIndex = 0;
						$scope.activeChartsArray[x]['config'] = [];
						var temp_series_array = [];
						for (var i = 1; i < $scope.selectedIDs.length + 1; i++) {
							$scope.activeChartsArray[x].data.push([]);
							let response = responses[x].data.rows;
							for (var j = 0; j < response.length; j++) {
								ttemp = response[j]['ts'].slice(0, response[j]['ts'].indexOf("+"));
								var mmx = moment.utc(ttemp);
								p_xval = mmx.valueOf();
								let col_number = i - 1;
								var temp_colname = 'v' + col_number.toString();
								if (typeof response[j][temp_colname] != 'undefined') {
									p_yval = parseFloat(response[j][temp_colname]);
									p_x = [p_xval, p_yval];
									$scope.activeChartsArray[x].data[i - 1].push(p_x);
								} else if (typeof response[j][temp_colname] == 'undefined') {}
							}

							temp_series_array.push({
								marker: {
									enabled: false,
									radius: 4
								},
								type: "line",
								color: $scope.colorArray[colorIndex],
								name: $scope.selectedIDs[i - 1].text,
								zIndex: 2,
								data: updateSeriesData($scope.activeChartsArray[x].data[i - 1]),
								lineWidth: 2,
								visible: true
							});

							if (colorIndex < 9) {
								colorIndex += 1;
							} else {
								colorIndex = 0;
							}

						}

						const sensorType = $scope.activeChartsArray[x].sensorType;
						const measurement = $scope.activeChartsArray[x].measurementText;
						const unit = $scope.activeChartsArray[x].unit;
						$scope.activeChartsArray[x]['config'] = {
							options: {
								lang:{
									noData: "No Data Recorded."
								},
								noData: {
									style: {
										fontWeight: 'bold',
										fontSize: '16px',
										color: '#303030'
									}
								},
								exporting: {
									enabled: false
								},
								chart: {
									marginRight: 25,
									zoomType: 'xy',
									backgroundColor: '#FFFFFF',
								},
								plotOptions: {
									series: {
										connectNulls: true
									}
               					},
								tooltip: {
									shared: true,
									formatter: function(){
										return tooltipFormaterFunction(this,sensorType,measurement);
									},
									crosshairs: {
										color: 'black',
										dashStyle: 'solid'
									},
								},
								yAxis: [{
									title: {
										text: ""
									},
									min: null,
									endOnTick: false,
									gridLineWidth: 1,
									lineWidth: 2,
									labels: {
										formatter: function(){
											return yAxisLabelFormaterFunction(this,sensorType,measurement,unit);
										},
									}
								}],
								xAxis: {
									minPadding: 0,
									maxPadding: 0,
									type: 'datetime',
									tickInterval: null,
									labels: {
										style: {
											color: '#000000'
										}
									}
								},
								legend: {
									enabled: false
								},
								credits: {
									enabled: false
								}
							},
							series: temp_series_array,
							title: {
								text: ""
							}
						};
					}
					$scope.loading = false;
				});

			}
		}

		$scope.$watch('selectedCount', function (newValue,oldValue) {
			if(newValue === oldValue || newValue === null || typeof newValue === 'undefined' ) return;
			$scope.numberChartsActive = newValue;
			$timeout(function () {
				$(window).resize();
			}, 600);
		});

		$scope.$watch('numberChartsActive', function () {
			$scope.chartNumbersChange();
		});

        function inArray(array,key,value){
            let isUnique = array.some(function(item) {
                if(this[0] === item[key])
                    {return item;}
            },[value]);
            return isUnique;
        }

		function isInArray(value, array) {
			for (let i = 0; i < array.length; i++) {
				if (value == array[i].sensorTypeRef) {
					return {
						bool: true,
						index: i
					};
				}
			}
			return {
				bool: false,
				index: null
			};
		}

		$scope.shortOverlay = false;

		$scope.selectSensor = function(){
			$scope.shortOverlay = true;
			$timeout(function(){
				$scope.shortOverlay = false
			},500);
			$scope.chartNumbersChange();
		}

		$scope.randomNumber = function (maxNumber) {
			return Math.round(Math.random() * maxNumber);
		}

		$scope.visibleSeries = function ($index) {
			var selectedIndex = $index;
			for (let i = 0; i < $scope.activeChartsArray.length; i++) {
				let chart = $('#chart'+$scope.activeChartsArray[i].divId).highcharts();
				let newValue = !chart.series[selectedIndex].visible;
				chart.series[selectedIndex].update({
					visible: newValue
				});
			}
		}

		let chartInterval = null;

		$scope.startInterval = function(){
			if(chartInterval) return;
            loadData();
            chartInterval = $interval(loadData,300 * 1000);//5minutes
		}

        $scope.cancelInterval = function(){
			if (chartInterval) {
            	$interval.cancel(chartInterval);
            	chartInterval = null;
          	}
		}

		$scope.$on('$destroy', function() {
        	$scope.cancelInterval();
		});

		$scope.startInterval();
	})

	.directive('jstree', function () {
		return {
			restrict: 'A',
			link: function (scope, element) {

				scope.selectedArray = [];

				scope.$on("treesummaryready", function () {
					$(element).jstree({
							"core": {
								'check_callback': true,
								"themes": {
									"name": "default",
									"dots": false,
									"icons": false
								},
								"data": scope.summaryTreeData
							},
							"checkbox": {
								"three_state": true
							},
							"plugins": ["search", "checkbox"]
						}, false)
						.bind("loaded.jstree", function (event, data) {
							$(this).jstree("open_all");
							$(this).jstree("select_node",['@29cd0ed2-43b2f4dc'],true);
						})
						.bind('select_node.jstree', function (e, data) {
							scope.$emit("checkedRef",data.node.text);
							scope.selected = data.node.original;
							// scope.$apply();
						})
						.bind('changed.jstree', function (e, data) {
							scope.temp_meters = data.selected;
							scope.$apply();
						})
						
				});
			}
		};
	})

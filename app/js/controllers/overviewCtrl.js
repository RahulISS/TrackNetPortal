angular.module('overviewCtrl', [])

	.controller('overviewController', function ($scope, $rootScope,Data, $timeout, $interval) {
		var overviewDatePickerFormat = "D/MM/YYYY";
		var skysparkDateFormat = "YYYY-MM-DD";

		$scope.actualvalueTab = true;
		$scope.equipName = "";

		$scope.measurementChartArray = [];
		$scope.chartDataArray = [];
		$scope.overviewTreeData = $rootScope.storage.treeData;
		if( $scope.overviewTreeData.length > 0 ){
			$timeout(function(){
				$scope.$broadcast('treedataready');
			},100)
		}

		$rootScope.$watch('storage.treeData',function(newVal,oldVal){
			if( newVal == undefined ) return;
            if( oldVal == undefined ) return;
			if( (newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal) ) return;
			$scope.overviewTreeData = newVal;
			$scope.$broadcast('treedataready');
		});

		$rootScope.$watch('storage.sensorData',function(newVal,oldVal){
			if( newVal == undefined ) return;
            if( oldVal == undefined ) return;
			if( (newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal) ) return;
			if(!$scope.$$phase) $scope.$apply();
		});

		// Weeksdays Start
        $scope.weekdays = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
        $scope.availableWeekdays = {};
        for (var i = 0; i < $scope.weekdays.length; i++) {
            $scope.availableWeekdays[$scope.weekdays[i]] = true;
        }

        function updateSeriesData(chartDataArray)
        {
        	var weekData = [];
            for(var j = 0; j < chartDataArray.length; j++) {
                var currWday = moment.utc(chartDataArray[j][0]).format('ddd').toUpperCase();
                if($scope.availableWeekdays[currWday] == true) {
                    weekData.push(chartDataArray[j]);
                }
            }
            return weekData;
        }

        $scope.toogleWeekDays = function (weekday) {
            $scope.availableWeekdays[weekday] = !$scope.availableWeekdays[weekday];
            for (var i = 0; i < $scope.chartDataArray.length; i++) {
            	$scope.measurementChartArray[i].config.series[0].data = updateSeriesData($scope.chartDataArray[i]);
            }
        };
        // Weeksdays End
		
		$scope.showTab = function (id) {
			var tempDivClass = "oneChartRightActual";
			if (id == "actualvalueTab") {
				$scope.actualvalueTab = true;
			} else {
				$scope.actualvalueTab = false;
				tempDivClass = "oneChartRight";
			}

			for (var i = 0; i < $scope.measurementChartArray.length; i++) {
				document.getElementById($scope.measurementChartArray[i].chartdivid).setAttribute("class", tempDivClass);
			}
			$scope.cancelInterval();
			$scope.startInterval();
			$timeout(function () {
				try {
					$scope.$broadcast('highchartsng.reflow');
				} catch (ex) {
					console.log('Chart config not ready.');
				}
			}, 100);
		};

		$('#overviewDateRange').daterangepicker({
				dateLimit: {
					years: 5
				},
				showDropdowns: false,
				timePicker: false,
				timePickerIncrement: 1,
				timePicker12Hour: true,
				ranges: {
					'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
					'Today': [moment(), moment()],
					'Last 7 Days': [moment().subtract('days', 6), moment()],
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
				if (start.isSame(end, "day")) $('#overviewDateRange span').html(start.format(overviewDatePickerFormat));
				else $('#overviewDateRange span').html(start.format(overviewDatePickerFormat) + ' - ' + end.format(overviewDatePickerFormat));

				$rootScope.storage.overview_startDate = start;
				$rootScope.storage.overview_endDate = end;

				$scope.overviewInterval = $rootScope.intervalFilter[$rootScope.adjustInterval(start, end)];
				$scope.$apply();
				$scope.cancelInterval();
				$scope.startInterval();
			}
		);

		changeDatePickerShow("#overviewDateRange", $rootScope.storage.overview_startDate, $rootScope.storage.overview_endDate, overviewDatePickerFormat);

		$scope.changeDateRange = function (direction) {
			var tempA = changeDateRange("#overviewDateRange", direction, $rootScope.storage.overview_startDate, $rootScope.storage.overview_endDate, overviewDatePickerFormat);
			$rootScope.storage.overview_startDate = tempA[0];
			$rootScope.storage.overview_endDate = tempA[1];
			$scope.cancelInterval();
			$scope.startInterval();
		};

		$scope.overviewInterval = $rootScope.intervalFilter[2];
		$scope.changeInterval = function () {
			$scope.cancelInterval();
			$scope.startInterval();
		};

		$scope.$watch("selected", function (newValue) {
			if( typeof newValue == "undefined" || newValue === null ){
				$scope.measurementChartArray = [];
				return;
			}
			const id = newValue.id;
			let sensorArray = JSON.parse(JSON.stringify($rootScope.storage.sensorData));
			//console.log(sensorArray);
			//let sensorArray = newValue.sensors;
			$scope.measurementChartArray = [];
			for (var i = 0; i < sensorArray.length; i++) {
				const domIdName = sensorArray[i].id_name.replaceAll(" ", "");
				const sensorType = sensorArray[i].kind;
				const measurement = sensorArray[i].id_name;
				const unit = sensorArray[i].unit;
				
				$scope.measurementChartArray.push({
					kind: sensorType,
					name: newValue.text,
					measurement: measurement,
					id: id,
					sensorId: sensorArray[i].id.split(" ")[0],
					unit: unit,
					fold: "avg",
					chartid: "chart_" + domIdName,
					chartdivid: "chartdiv_" + domIdName,
					tdid: "td_" + domIdName,
					maxid: "max_" + domIdName,
					minid: "min_" + domIdName,
					avgid: "avg_" + domIdName,
				});
			}
			if($scope.actualvalueTab){
				$scope.equipName = newValue.text;
			}
			$scope.cancelInterval();
			$scope.startInterval();
		});

		function getAllData() {
			for (var i = 0; i < $scope.measurementChartArray.length; i++) {
				getData($scope.measurementChartArray[i],i,setSomeData);
			}
		}

		function setSomeData(obj,data){

			obj['config'] = {
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
					tooltip: {
						xDateFormat: '%A, %b %e, %Y %H:%M',
						shared: true,
						formatter: function(){
							return tooltipFormaterFunction(this,obj.kind,obj.measurement);
						},
						crosshairs: {
							color: 'black',
							dashStyle: 'solid'
						},
					},
					chart: {
						zoomType: "xy"
					},
					plotOptions: {
						series: {
							connectNulls: true,
							events: {
								afterAnimate: function () {
									if(this.chart.resetZoomButton!=undefined) {
										this.chart.zoomOut();
									}
								}
							}
						}
					},
					yAxis: [{
						title: {
							text: ""
						},
						endOnTick: false,
						gridLineWidth: 1,
						lineWidth: 1,
						labels: {
							formatter: function(){
								return yAxisLabelFormaterFunction(this,obj.kind,obj.measurement,obj.unit);
							},
						}
					}],
					xAxis: {
						minPadding: 0,
						maxPadding: 0,
						type: 'datetime',
						//tickInterval: 3600 * 1000,
						tickPixelInterval: 100,
						gridLineWidth: 1,
					},
					legend: {
						enabled: false
					},
					credits: {
						enabled: false
					}
				},
				series: [{
					marker: {
						enabled: false
					},
					type: "line",
					color: "#049",
					name: obj.name,
					data: updateSeriesData(data),
				}],
				title: {
					text: ""
				}
			}

		}

		function getData(obj,indexer,dataSetter) {
			$timeout(function () {
				tempindex = obj.measurement.indexOf(" ");
				if (tempindex == -1) {
					if ( typeof obj.unit !== 'undefined' && obj.kind === 'Number' ){
						temptdStr = obj.measurement  + "<br><br>" + obj.unit;
					} else{
						temptdStr = obj.measurement;
					}
				} else {
					temptdStr = obj.measurement.substring(0, tempindex) + "<br>" +
						obj.measurement.substring(tempindex + 1) + "<br><br>";
						if (typeof obj.unit !== 'undefined' && obj.kind === 'Number'){
							temptdStr += obj.unit ;
						}
				}
				document.getElementById(obj.tdid).innerHTML = temptdStr;
				var tempDivClass = "oneChartRightActual";
				if (!$scope.actualvalueTab) tempDivClass = "oneChartRight";
				document.getElementById(obj.chartdivid).setAttribute("class", tempDivClass);

				try {
					$scope.$broadcast('highchartsng.reflow');
				} catch (ex) {
					console.log('Chart config not ready.');
				}
			}, 50);

			var datespan = moment($rootScope.storage.overview_startDate).format(skysparkDateFormat) + ".." + moment($rootScope.storage.overview_endDate).format(skysparkDateFormat);
			var rollup = $scope.overviewInterval.value;
			if (rollup == '') rollup = '15min';
			let foldValue;
			if( $scope.actualvalueTab ){
				foldValue = 'actual';
			}else{
				foldValue = obj.fold;
			}
			const query = `html_plot_chart_06_b([${obj.id}],${obj.sensorId},${datespan},"${foldValue}",${rollup})`;
			Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function (response) {
				const data = response.data.rows;
				if(data.length === 0 ) return;
				var dataSet = [];
				for (var i = 0; i < data.length; i++) {
					var ttemp = data[i].ts.slice(0, data[i].ts.indexOf("+"));
					var mmx = moment.utc(ttemp);
					var xval = mmx.valueOf();
					if (typeof data[i].v0 == "undefined") continue;
					var yval = parseFloat(data[i].v0);
					dataSet.push([xval, yval]);
				}
				$scope.chartDataArray[indexer] = dataSet;
				dataSetter(obj,dataSet);
			});
		}

		$scope.changeFold = function (a, fold) {
			for (var i = 0; i < $scope.measurementChartArray.length; i++) {
				if ($scope.measurementChartArray[i].chartid == a.oneChartItem.chartid) {
					$scope.measurementChartArray[i].fold = fold;
					document.getElementById(a.oneChartItem.avgid).setAttribute("class", "btn btn-default overviewfoldbuttonOff stand_font");
					document.getElementById(a.oneChartItem.maxid).setAttribute("class", "btn btn-default overviewfoldbuttonOff stand_font");
					document.getElementById(a.oneChartItem.minid).setAttribute("class", "btn btn-default overviewfoldbuttonOff stand_font");
					document.getElementById(fold + "_" + a.oneChartItem.measurement.replace(" ","")).setAttribute("class", "btn btn-default overviewfoldbuttonOn stand_font");
					clearOneChart(a.oneChartItem.chartid);
					getData(a.oneChartItem,i,setSomeData);
					break;
				}
			}
		}

		function clearOneChart(chartid) {
			var tempchart = $('#' + chartid).highcharts();
			tempchart.series[0].update({
				data: []
			});
		}

		let chartInterval = null;

		$scope.startInterval = function(){
			if(chartInterval) return;
            getAllData();
            chartInterval = $interval(getAllData,300 * 1000);//5minutes
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

	/*
	Directive for the meter tree START
	*/
	.directive('jstreeover', function () {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				//scope.selectArray = [];

				scope.$on("treedataready", function (event, data) {
					$(element).jstree({
							"core": {
								'check_callback': true,
								"multiple": false,
								"themes": {
									"name": "default",
									"dots": false,
									"icons": false
								},
								"data": scope.overviewTreeData
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
						.bind('deselect_node.jstree', function (e, data) {
							scope.selected = null;
							scope.$apply();
						})
				});
			}
		};
	})

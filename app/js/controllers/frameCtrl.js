angular.module('frameCtrl', [])

	.controller('frameController', function ($scope, $rootScope, $state, $sessionStorage) {

		$rootScope.storage = $sessionStorage.$default({
			treeData: [],
			sensorData: [],
			instalationTracNet: [],
			locationTracNet: [],
			instalationTracNetCalender: [],
			locationTracNetCalenderNew: [],
			summary_checkedMeasurement: ["freechlorine"],
			summary_selectedMeters: [],
			summary_startDate: moment().subtract(7, "day"),
			summary_endDate: moment(),
			download_startDate: moment().subtract(7, "day"),
			download_endDate: moment(),
			overview_startDate: moment().subtract(7,"day"),
			overview_endDate: moment(),
			overview_selected_meter: 'a2sac',
			report_selected_meter: 'a2sac',
			report_startDate: moment().subtract(30, "day"),
			report_endDate: moment(),
			report_measurement_index: 0,
			report_rollup_index: 0,
			report_interval_index: 2,
			report_weekdaylist: [0, 1, 2, 3, 4, 5, 6],
			chartsRangeStartDate: moment().subtract(6, "day"),
			chartsRangeEndDate: moment(),
			chartsRange1StartDate: moment(),
			chartsRange1EndDate: moment(),
			chartsRange2StartDate: moment().subtract(1, "day"),
			chartsRange2EndDate: moment().subtract(1, "day"),
			chart_selectedMeters: ["a2sac"],
			selectedRollupIndex: 1,
			username: null,
			authToken: false,
			loggedIn: false,
			meterInstallSelectionActive: false,
			settingsBarActive: false,
			selectedSiteID: null,
			selectedInstallation: null,
			selectedInterval: '1hr',
			selectedDays: '[0day,1day,2day,3day,4day,5day,6day]',
			ampFilter: '60A,10min',
			intervalVisible: true,
			gridLineVisible: true,
			ampFilterVisible: false,
			targetStability: false,
			daySelectionVisible: false,
			markerVisible: true,
			exportVisible: false,
			tableVisible: false,
			minYAxisVisible: true,
			gridLines: 1,
			markers: false,
			minYAxis: null
		});

		$rootScope.intervalFilter = [{
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

		$rootScope.adjustInterval = function (start, end) {
			var tempdiff = moment(end).diff(moment(start), 'hours');
			// <=3 days 5min
			if (tempdiff <= 72) return 0;
			// <=7 days 15 min
			else if (tempdiff <= 168) return 2;
			// <=32 days 1 hr
			else if (tempdiff <= 768) return 4;
			// <=63 days 3 hr
			else if (tempdiff <= 1512) return 5;
			else if (tempdiff <= 8760) return 6;
			else return 8;
		};

		$rootScope.diffInDaysDatePicker = function(start,end) {
			return parseInt(end.diff(start) / (1000 * 3600 * 24));
		}

		$rootScope.diffInDaysDate = function(start,end) {
			return parseInt((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
		}

		$rootScope.addDaysToDate = function(date,noOfDays) {
			const addedTime = noOfDays * (1000 * 3600 * 24);
			const totalTime = date.getTime() + addedTime;
			return new Date(totalTime);
		}

		$rootScope.getIntervalIndex = function (interval) {
			for (var i = 0; i < $scope.intervalFilter.length; i++) {
				if (interval.name == $scope.intervalFilter[i].name) return i;
			}
			return -1;
		};

		$rootScope.foldmethodFilter = [{
				name: 'actual',
				value: 'actual'
			},
			{
				name: 'avg',
				value: 'avg'
			},
			{
				name: 'max',
				value: 'max'
			},
			{
				name: 'min',
				value: 'min'
			}
		];

		if($rootScope.storage.loggedIn != true){
			$state.go('login');
            return;
        }

	});

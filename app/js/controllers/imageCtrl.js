angular.module('imageCtrl', [])

    .controller('imageController', function ($scope, $rootScope, Data, $q, $http, $timeout, $interval) {

        $scope.loading = false;
        const dataPickerFormat = "D/MM/YYYY";
        const skySparkFormat = "YYYY-MM-DD";
        const gridTickColor = "#b9b9b9";

        var currentLegend = 0;

        $scope.activeSelectionFromTree = '';
        $scope.imageNodeSelection = '';
        $scope.isSelectionChanged = false;
        $scope.isEmptySmallBoxes = false;

        $scope.data_table_meter_page = [];

        $scope.chartIntervalFilter = [...$rootScope.intervalFilter];
        $scope.chartIntervalFilter.unshift({
            name: '1 min',
            value: '1min'
        });
        $scope.rollup = $scope.chartIntervalFilter[$rootScope.storage.selectedRollupIndex];

        $scope.options = {
            aoColumns: [{
                "sTitle": "Timestamp"
            }, {
                "sTitle": "v0"
            }, {
                "sTitle": "v1"
            }, {
                "sTitle": "v2"
            }, {
                "sTitle": "v3"
            }, {
                "sTitle": "v4"
            }, {
                "sTitle": "v5"
            }, {
                "sTitle": "v6"
            }, {
                "sTitle": "v7"
            }],
            aoColumnDefs: [{
                "bSortable": true,
                "aTargets": [0, 1]
            }],
            bJQueryUI: true,
            bDestroy: true,
            aaData: [
                ["", "", "", "", "", "", "", "", ""]
            ]
        };

        $scope.imageTreeData = $rootScope.storage.treeData;
        if ($scope.imageTreeData.length > 0) {
            $timeout(function () {
                $scope.$broadcast('treeimageready');
            }, 100)
        }

        $rootScope.$watch('storage.treeData', function (newVal, oldVal) {
            if ((newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal)) return;
            $scope.imageTreeData = newVal;
            $scope.$broadcast('treeimageready');
        });

        $rootScope.$watch('storage.sensorData', function (newVal, oldVal) {
            if ((newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal)) return;
            if (!$scope.$$phase) {
                $scope.$apply();
            } else {
                $timeout(function () {
                    $scope.$apply();
                }, 1000);
            }
            // loadData();
        });

        // Weeksdays Start
        $scope.weekdays = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
        $scope.availableWeekdays = {};
        for (var i = 0; i < $scope.weekdays.length; i++) {
            $scope.availableWeekdays[$scope.weekdays[i]] = true;
        }

        function updateSeriesData()
        {
            var isReloadChart = false;
            for (var i = 0; i < $scope.tableStats.length; i++) {
                if($scope.tableStats[i].pointId!=null && $scope.tableStats[i].pointId!='null') {
                    var weekData = [];
                    for(var j = 0; j < $scope.tableStats[i].data.length; j++) {
                        var currWday = moment.utc($scope.tableStats[i].data[j][0]).format('ddd').toUpperCase();
                        if($scope.availableWeekdays[currWday] == true) {
                            weekData.push($scope.tableStats[i].data[j]);
                        }
                    }
                    $scope.meterChartConfig1.series[i].data = weekData;
                    isReloadChart = true;
                }
            }
            return isReloadChart;
        }

        $scope.toogleWeekDays = function (weekday) {
            $scope.availableWeekdays[weekday] = !$scope.availableWeekdays[weekday];
            if(updateSeriesData()) {
                getYminMax();
                gotoframeUsingTimeMili($scope.tableStats[0].data[0][0]);
            }
        };
        // Weeksdays End

        const loadingScatter = "Loading...";
        const noDataTxtScatter = "No Data Recorded.";
        $scope.scatterChartConfig = {};
        $scope.scatterChartConfigCount = [];
        $scope.activeScatterChart = '';

        $scope.$watch("selected", function (newNode) {
            if(newNode == undefined || newNode == null || newNode == 'null') return;
            $scope.scatterChartConfig[newNode.id] = {
                options: {
                    lang:{
                        noData: noDataTxtScatter
                    },
                    noData: {
                        style: {
                            fontWeight: "bold",
                            fontSize: "16px",
                            color: "#303030"
                        }
                    },
                    exporting: {
                        enabled: false
                    },
                    chart: {
                        type: "scatter",
                        spacing: [5, 2, 2, 2],
                        zoomType: "xy"
                    },
                    yAxis: {
                        title: {
                            text: "Level (mm)"
                        },
                        min: 0,
                        startOnTick: true,
                        endOnTick: true,
                        showLastLabel: true
                    },
                    xAxis: {
                        title: {
                            enabled: true,
                            text: "Velocity (m/s)"
                        },
                        min: 0,
                        startOnTick: true,
                        endOnTick: true,
                        showLastLabel: true
                    },
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            color: "#3255A2",
                            turboThreshold: 0
                        },
                        scatter: {
                            marker: {
                                radius: 2,
                                states: {
                                    hover: {
                                        enabled: true,
                                        lineColor: "rgb(100,100,100)"
                                    }
                                }
                            },
                            states: {
                                hover: {
                                    marker: {
                                        enabled: false
                                    }
                                }
                            },
                            tooltip: {
                                headerFormat: '<b style="color:#3255A2">Level v/s Velocity</b><br/>',
                                pointFormat: "<b>{point.name}</b><br/>{point.x} mm, {point.y} m/s"
                            }
                        }
                    },
                },
                title: {
                    text: newNode.text.substring(0,38),
                    margin: 5
                },
                series: [{
                    data: [] 
                }],
                frmDate: '',
                toDate: '',
                cachedData: []
            };
            $scope.scatterChartConfigCount = Object.keys($scope.scatterChartConfig);
            $scope.activeScatterChart = newNode.id;
            if($scope.showScatterPlot) $scope.displayScatterPlot();
        });

        $scope.showScatterPlot = false;
        $scope.optionGridToOne = [
            {
                value: 1,
                label: "One at a Time"
            },
            {
                value: 2,
                label: "Grid"
            }
        ];
        $scope.showGridToOne = $scope.optionGridToOne[0];

        $scope.toggleScatterPlot = function () {
            for(let idx in $scope.scatterChartConfig) {
                if($scope.showScatterPlot) {
                    $scope.scatterChartConfig[idx].series[0].data = [];
                } else {
                    $scope.scatterChartConfig[idx].options.lang.noData = loadingScatter;
                }
            }
            $scope.showScatterPlot = !$scope.showScatterPlot;
            if($scope.showScatterPlot) {
                adjustGridToOne();
                $timeout(function(){
                    $scope.displayScatterPlot();
                },500);
            }
        }

        $scope.setAsActiveScatter = function (idx) {
            $scope.activeScatterChart = idx;
            $scope.displayScatterPlot();
        }

        function adjustGridToOne() {
            let wFact = 1;
            let hFact = 1;
            if($scope.showGridToOne.value==2) {
                if($scope.scatterChartConfigCount.length==4) {
                    wFact = hFact = 2;
                } else {
                    hFact = $scope.scatterChartConfigCount.length<=3?1:($scope.scatterChartConfigCount.length<=6?2:3);
                    wFact = $scope.scatterChartConfigCount.length>=3?3:$scope.scatterChartConfigCount.length;
                }
            }
            const spCW = (document.getElementById('scatterPlotCaontainer').clientWidth-18) / wFact;
            const spCH = (document.getElementById('scatterPlotCaontainer').clientHeight-50) / hFact;
            for(let idx in $scope.scatterChartConfig) {
                $scope.scatterChartConfig[idx].options.chart.width = spCW;
                $scope.scatterChartConfig[idx].options.chart.height = spCH;
            }
        }

        $scope.$watch("showGridToOne", function () {
            adjustGridToOne();
        });

        $scope.displayScatterPlot = function () {
            let queriesArray = [];
            let frmDate = moment($rootScope.storage.chartsRangeStartDate).format(skySparkFormat);
            let toDate = moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat);
            adjustGridToOne();
            for(let idx in $scope.scatterChartConfig) {
                if($scope.scatterChartConfig[idx].frmDate!=frmDate || $scope.scatterChartConfig[idx].toDate!=toDate || $scope.scatterChartConfig[idx].cachedData.length==0) {
                    queriesArray.push({
                        'index': idx,
                        'query': `html_aTreeNode_scatterplot_hisRead_01_a(${idx},${frmDate},${toDate})`
                    });
                    $scope.scatterChartConfig[idx].frmDate = frmDate;
                    $scope.scatterChartConfig[idx].toDate = toDate;
                    $scope.scatterChartConfig[idx].cachedData = [];
                    $scope.scatterChartConfig[idx].series[0].data = [];
                } else {
                    $scope.scatterChartConfig[idx].series[0].data = $scope.scatterChartConfig[idx].cachedData;
                }
            }

            const promises_data = queriesArray.map(function (item) {
                return Data.sendRequest(item.query, $rootScope.storage.skysparkVersion).then(function (reqResult) {
                    return {
                        'idx': item.index,
                        'data': reqResult.data
                    };
                });
            });

            $q.all(promises_data).then(function (responses) {
                if (responses.length !== queriesArray.length) return;

                for (let j = 0; j < responses.length; j++) {
                    let serialData = [];
                    for (let i = 0; i < responses[j].data.rows.length; i++) {
                        let tempEach = {name:'', x:'',y:''};
                        if(responses[j].data.rows[i].ts!=undefined) {
                            tempEach.name = moment.utc(responses[j].data.rows[i].ts.split('+')[0]).format("D/M/YYYY h:mma");
                        }
                        if(responses[j].data.rows[i].level1!=undefined) tempEach.y = responses[j].data.rows[i].level1;
                        if(responses[j].data.rows[i].velocity1!=undefined) tempEach.x = responses[j].data.rows[i].velocity1;
                        if(tempEach.x!='') serialData.push(tempEach);
                    }
                    $scope.scatterChartConfig[responses[j].idx].series[0].data = serialData;
                    $scope.scatterChartConfig[responses[j].idx].cachedData = serialData;
                    $scope.scatterChartConfig[responses[j].idx].options.lang.noData = noDataTxtScatter;
                }
            });
        };
        // Scatter Plot Done

        $('#chartsRange').daterangepicker({
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
                if (start.isSame(end, "day")) $('#chartsRange span').html(start.format(dataPickerFormat));
                else $('#chartsRange span').html(start.format(dataPickerFormat) + ' - ' + end.format(dataPickerFormat));

                $rootScope.storage.chartsRangeStartDate = start;
                $rootScope.storage.chartsRangeEndDate = end;

                $rootScope.storage.selectedRollupIndex = $rootScope.adjustInterval(start, end);
                $scope.rollup = $scope.chartIntervalFilter[$rootScope.storage.selectedRollupIndex];

                $scope.$apply();
                $scope.cancelInterval();
                $scope.startInterval();
                load_img_chart(true);
            });

        changeDatePickerShow("#chartsRange", $rootScope.storage.chartsRangeStartDate, $rootScope.storage.chartsRangeEndDate, dataPickerFormat);

        $scope.changeDateRange = function (direction) {
            var tempA = changeDateRange("#chartsRange", direction, $rootScope.storage.chartsRangeStartDate, $rootScope.storage.chartsRangeEndDate, dataPickerFormat);
            $rootScope.storage.chartsRangeStartDate = tempA[0];
            $rootScope.storage.chartsRangeEndDate = tempA[1];
            $scope.cancelInterval();
            $scope.startInterval();
            load_img_chart(true);
        };

        $scope.changeInterval = function () {
            $rootScope.storage.selectedRollupIndex = $rootScope.getIntervalIndex($scope.rollup);
            $scope.cancelInterval();
            $scope.startInterval();
            load_img_chart();
        };

        $scope.clearData = function () {
            clearChartData();
            setVisible();
            $scope.activeSelectionFromTree = '';
            $scope.imageNodeSelection = '';
            $scope.isSelectionChanged = false;
            $('#imageTree .jstree-undetermined').removeClass('jstree-undetermined');
            $scope.selectLegend(0);
        };

        function clearChartData() {
            for (var i = 0; i < $scope.tableStats.length; i++) {
                $scope.tableStats[i].title = "";
                $scope.tableStats[i].pointId = "null";
                $scope.tableStats[i].measurements = [];
                $scope.tableStats[i].fold = {
                    name: "null",
                    value: "null"
                };
                $scope.tableStats[i].max = 0;
                $scope.tableStats[i].min = 0;
                $scope.tableStats[i].avg = "";
                $scope.tableStats[i].sum = 0;
                $scope.tableStats[i].data = [];
                $scope.meterChartConfig1.series[i].data = [];
                $scope.meterChartConfig1.options.yAxis[i].min = null;
                $scope.meterChartConfig1.options.yAxis[i].max = null;
                $scope.tableViewData = [];
            }
        }

        function setVisible() {
            for (var i = 0; i < $scope.tableStats.length; i++) {
                if ($scope.tableStats[i].pointId == null || $scope.tableStats[i].pointId == "null") {
                    document.getElementById($scope.tableStats[i].hideDivId).style.visibility = "hidden";
                    document.getElementById($scope.tableStats[i].hideCloseDivId).style.visibility = "hidden";
                } else {
                    document.getElementById($scope.tableStats[i].hideDivId).style.visibility = "visible";
                    document.getElementById($scope.tableStats[i].hideCloseDivId).style.visibility = "visible";
                }
            }
        }

        $scope.tableStatArr = [
            [0, 1, 2, 3],
            [4, 5, 6, 7]
        ]

        $scope.changeMeasurement = function () {
            $scope.cancelInterval();
            $scope.startInterval();
        };

        $scope.changeFold = function () {
            $scope.cancelInterval();
            $scope.startInterval();
        };

        $scope.switchGridLine = function (page) {
            $scope.chartStatusSet[page].gridlines = !$scope.chartStatusSet[page].gridlines;
            if ($scope.chartStatusSet[page].gridlines) {
                document.getElementById(page + "_gridLinesButton").setAttribute("class", "btnTopBar");
                for (var i = 0; i < $scope.chartStatusSet[page].charts.options.yAxis.length; i++)
                    $scope.chartStatusSet[page].charts.options.yAxis[i].gridLineWidth = 2;
                if (page == "meter") $scope.chartStatusSet[page].charts.options.xAxis.gridLineWidth = 2;
                else {
                    for (var i = 0; i < $scope.chartStatusSet[page].charts.options.xAxis.length; i++)
                        $scope.chartStatusSet[page].charts.options.xAxis[i].gridLineWidth = 2;
                }
            } else {
                document.getElementById(page + "_gridLinesButton").setAttribute("class", "btnTopBarOff");
                for (var i = 0; i < $scope.chartStatusSet[page].charts.options.yAxis.length; i++)
                    $scope.chartStatusSet[page].charts.options.yAxis[i].gridLineWidth = 0;
                if (page == "meter") $scope.chartStatusSet[page].charts.options.xAxis.gridLineWidth = 0;
                else {
                    for (var i = 0; i < $scope.chartStatusSet[page].charts.options.xAxis.length; i++)
                        $scope.chartStatusSet[page].charts.options.xAxis[i].gridLineWidth = 0;
                }
            }

            $timeout(function () {
                showMarkers(page);
            }, 100);
        };

        $scope.switchYmin = function (page) {
            $scope.chartStatusSet[page].ymin = !$scope.chartStatusSet[page].ymin;
            if ($scope.chartStatusSet[page].ymin === true) {
                document.getElementById(page + "_yminButton").setAttribute("class", "btnTopBar");
            } else {
                document.getElementById(page + "_yminButton").setAttribute("class", "btnTopBarOff");
            }

            /*for (let i = 0; i < $scope.chartStatusSet["meter"].charts.options.yAxis.length; i++) {
                if (!($scope.tableStats[i].pointId === null || $scope.tableStats[i].pointId === "null")) {
                    if ($scope.chartStatusSet["meter"].ymin) {
                        $scope.chartStatusSet["meter"].charts.options.yAxis[i].min = 0;
                        $scope.chartStatusSet["meter"].charts.options.yAxis[i].max = $scope.tableStats[i].ymin_max;
                    } else {
                        $scope.chartStatusSet["meter"].charts.options.yAxis[i].min = $scope.tableStats[i].ymin_min;
                        $scope.chartStatusSet["meter"].charts.options.yAxis[i].max = $scope.tableStats[i].ymin_max;
                    }
                }
            }*/
            getYminMax();
            $timeout(function () {
                showMarkers(page);
            }, 100);
        };

        $scope.switchMarkers = function (page) {
            $scope.chartStatusSet[page].markers = !$scope.chartStatusSet[page].markers;
            if ($scope.chartStatusSet[page].markers) {
                document.getElementById(page + "_markersButton").setAttribute("class", "btnTopBar");
            } else {
                document.getElementById(page + "_markersButton").setAttribute("class", "btnTopBarOff");
            }
            showMarkers(page);
        };

        function showMarkers(page) {
            var chart = $('#chartsMeterCompare1').highcharts();
            chart.series[0].update({
                marker: {
                    enabled: $scope.chartStatusSet[page].markers
                }
            });
            chart.series[1].update({
                marker: {
                    enabled: $scope.chartStatusSet[page].markers
                }
            });
            if (page == "meter") {
                chart.series[2].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });
                chart.series[3].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });

                chart.series[4].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });

                chart.series[5].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });

                chart.series[6].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });

                chart.series[7].update({
                    marker: {
                        enabled: $scope.chartStatusSet[page].markers
                    }
                });
            }

        }

        $scope.download = function (page) {
            var series = $scope.chartStatusSet[page].charts.series;
            downloadCsvFile(series, "meter.csv");
        };

        function downloadCsvFile(series, filename) {
            var tempDataList = [];
            var contents = "ts,";
            for (var i = 0; i < $scope.tableStats.length; i++) {
                if (!($scope.tableStats[i].pointId == null || $scope.tableStats[i].pointId == "null"))
                    contents = contents + $scope.tableStats[i].title + " - " + $scope.tableStats[i].currentMeasurement.id_name + ",";
            }
            contents = contents.slice(0, contents.length - 1);
            contents = contents + '\n';

            for (var i = 0; i < series.length; i++)
                if (series[i].data.length > 0) tempDataList.push(series[i].data);

            if (tempDataList.length == 0) return;

            var tempArray = tempDataList[0];

            for (var i = 0; i < tempArray.length; i++) {
                contents = contents + moment.utc(tempArray[i][0]).format("YYYY-MM-DD  HH:mm") + ",";
                for (var j = 0; j < tempDataList.length; j++) {
                    if (typeof tempDataList[j][i] != "undefined")
                        contents = contents + tempDataList[j][i][1] + ",";
                }
                contents = contents.slice(0, contents.length - 1);
                contents = contents + '\n';
            }

            $http.post('php/charts/downloadcsv.php', {
                'filename': filename,
                'contents': contents
            }).then(function (data) {
                var hiddenElement = document.createElement('a');
                hiddenElement.href = 'data:attachment/csv,' + encodeURI(data.data);
                hiddenElement.target = '_blank';
                hiddenElement.download = filename;
                document.body.appendChild(hiddenElement);
                hiddenElement.click();
            }, function (err) {
                console.log(err)
            });
        }

        $scope.switchTable = function (page, visible) {
            $scope.showMeasureTable = visible;
        };

        $scope.selectLegend = function (index) {
            for (var i = 0; i < $scope.tableStats.length; i++) {
                try {
                    document.getElementById($scope.tableStats[i].divId).style.borderColor = "#666";
                    document.getElementById($scope.tableStats[i].divId).style.borderWidth = "thin";
                } catch (err) { }
            }
            try {
                document.getElementById($scope.tableStats[index].divId).style.borderColor = $scope.tableStats[index].colour;
                document.getElementById($scope.tableStats[index].divId).style.borderWidth = "medium";
                currentLegend = index;
            } catch (err) { }
        }

        $scope.clearNodeData = function (index, clickedClose) {
            if (clickedClose == undefined) clickedClose = false
            var isLast = 0;
            if (clickedClose == true) {
                for (var i = 0; i < $scope.tableStats.length; i++) {
                    if ($scope.tableStats[i].pointId !== 'null' && $scope.tableStats[i].pointId !== null) {
                        isLast++;
                    }
                }
            }
            $scope.tableStats[index].title = "";
            $scope.tableStats[index].pointId = "null";
            $scope.tableStats[index].measurements = [];
            $scope.tableStats[index].fold = {
                name: "null",
                value: "null"
            };
            $scope.tableStats[index].max = 0;
            $scope.tableStats[index].min = 0;
            $scope.tableStats[index].avg = "";
            $scope.tableStats[index].sum = 0;
            $scope.tableStats[index].data = [];
            $scope.meterChartConfig1.series[index].data = [];
            $scope.meterChartConfig1.options.yAxis[index].min = null;
            $scope.meterChartConfig1.options.yAxis[index].max = null;
            setVisible();
            setNextCurrentLegend();
            if (isLast == 1) {
                $scope.activeSelectionFromTree = '';
                $scope.imageNodeSelection = '';
                $scope.isSelectionChanged = false;
                $('#imageTree .jstree-undetermined').removeClass('jstree-undetermined');
            }
        };

        function node_select() {
            $scope.$watch("selected", function (node) {
                if (typeof node === "undefined" || node === null) {
                    return;
                }
                if($scope.showScatterPlot) {
                    $scope.activeSelectionFromTree = node.id;
                    return;
                }

                var counterTs = 0;
                var isSelectionChanged = false;
                if ($scope.activeSelectionFromTree != node.id) {
                    isSelectionChanged = true;
                } else {
                    for (var k = 0; k < $scope.tableStats.length; k++) {
                        if ($scope.tableStats[k].pointId != null && $scope.tableStats[k].pointId != 'null') {
                            counterTs++;
                        }
                    }
                    if (counterTs == $scope.tableStats.length) {
                        alert('A maximum of 8 sensors per chart.');
                        return;
                    }
                }
                if (isSelectionChanged) clearChartData();
               // const query = `html_flowSiren_getAll_aSensorType_flow_01_a(${node.id},${moment($rootScope.storage.chartsRangeStartDate).format(skySparkFormat)},${moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat)})`;
               //const query = `html_flowSiren_getAll_aSensorType_flow_01_a(${node.id},${moment($rootScope.storage.chartsRangeStartDate).format(skySparkFormat)},${moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat)})`;
               const query = `html_vision_getDefaultSensors_01_a( read( aPortal and id_name == "sewerage demo" and aCustomerRef->id_name == "Gold Coast Water" )->id )`;
                // added function for the first load time image and graphp will be visible.
                let queryInfo = { query: query + (isSelectionChanged ? '' : '.first()') };
                $scope.queriesArray_new.push(queryInfo);
                $scope.activeSelectionFromTree = node.id;

                const promises_data_new1 = $scope.queriesArray_new.map(function (item) {

                    return Data.sendRequest(item.query, $rootScope.storage.skysparkVersion).then(function (reqResult) {
                        let lengthRows = reqResult.data.rows.length;
                        if(lengthRows==0) {
                            clearChartData();
                            setVisible();
                            $scope.selectLegend(0);
                            $scope.isEmptySmallBoxes = true;
                        } else {
                            $scope.isEmptySmallBoxes = false;
                        }
                        if (($scope.tableStats.length - counterTs) < reqResult.data.rows.length) lengthRows = 1;
                        for (var i = 0; i < lengthRows; i++) {

                            if (isSelectionChanged) $scope.clearNodeData(i);
                            if (isSelectionChanged) $scope.clearNodeData(i + 1);
                            if (isSelectionChanged) $scope.clearNodeData(i + 2);
                            $scope.tableStats[currentLegend].pointId = node.id;
                            $scope.tableStats[currentLegend].title = node.text;
                            $scope.tableStats[currentLegend].measurements = $rootScope.storage.sensorData;
                            for (j = 0; j < $rootScope.storage.sensorData.length; j++) {
                                if (isSelectionChanged) {
                                    if ($rootScope.storage.sensorData[j].id_name == reqResult.data.rows[i].sensorName) {
                                        $scope.tableStats[currentLegend].currentMeasurement = $scope.tableStats[currentLegend].measurements[j];
                                    }
                                } else {
                                    if ($rootScope.storage.sensorData[j].id_name == $rootScope.storage.sensorData[0].id_name) {
                                        $scope.tableStats[currentLegend].currentMeasurement = $scope.tableStats[currentLegend].measurements[j];
                                    }
                                }
                            }

                            $scope.tableStats[currentLegend].fold = $rootScope.foldmethodFilter[1];
                            document.getElementById($scope.tableStats[currentLegend].hideDivId).style.visibility = "visible";
                            document.getElementById($scope.tableStats[currentLegend].hideCloseDivId).style.visibility = "visible";
                            setNextCurrentLegend($scope.tableStats);

                            $scope.cancelInterval();
                            $scope.startInterval(true);

                        }
                    });
                });

                /*const query2 = 'readAll( aPortalSensorType and aPortalRef->id_name == "sewerage demo" ).findAll( row => not isEmpty( readAll( aTreeNodePortalMetric and aTreeNodeRef == read( aTreeNode and textLabel =="'+node.text+'" and aTreeRef->aPortalRef->id_name == "sewerage demo" )->id and aPortalMetricRef->aSensorTypeRef == row->aSensorTypeRef ) ) ).sort( "rank" ).map( row => set( row , "aSensorType_id_name" , row->aSensorTypeRef->id_name ) ).first()';
                Data.sendRequest(query2,$rootScope.storage.skysparkVersion).then(function(response){
                    console.log(response.data.rows);
                });*/
            });

        }

        function setNextCurrentLegend() {
            for (var i = 0; i < $scope.tableStats.length; i++) {
                if ($scope.tableStats[i].pointId == "null" || $scope.tableStats[i].pointId == null) {
                    $scope.selectLegend(i);
                    return;
                }
            }
        }

        $scope.tableStats = [];
        //an empty one
        var tempTSI = new tableStatItem(0, "#1f77b4");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(1, "#ff7f0e");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(2, "#2ca02c");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(3, "#d62728");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(4, "#9467bd");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(5, "#8c564b");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(6, "#e377c2");
        $scope.tableStats.push(tempTSI);

        tempTSI = new tableStatItem(7, "#7f7f7f");
        $scope.tableStats.push(tempTSI);

        function tableStatItem(id, colour) {
            this.colour = colour;
            this.divId = "stat_" + id;
            this.hideDivId = "scon_" + id;
            this.hideCloseDivId = "cscon_" + id;
            this.title = "";
            this.pointId = "null";
            this.measurements = [];
            this.fold = {
                name: "null",
                value: "null"
            };
            this.max = 0;
            this.min = 0;
            this.avg = "";
            this.sum = 0;
            this.data = [];
        }

        $scope.readable = function (datatype) {

            let readable;
            if (typeof (datatype) === undefined || typeof (datatype) === 'undefined') return;
            if (typeof (datatype) == 'string') {
                if (datatype != "") {
                    readable = moment(datatype.slice(0, datatype.indexOf("+"))).format("Do MMM YYYY HH:mm:ssa");
                }
            } else if (datatype === null) {
                readable = " ";
            } else {
                readable = parseFloat(datatype.toFixed(2));
            }
            return readable;

        }

        function getYminMax() {
            var minUnit = {}, maxUnit = {};
            for (let i = 0; i < $scope.tableStats.length; i++) {
                if ($scope.tableStats[i].pointId !== 'null' && $scope.tableStats[i].pointId !== null) {
                    if (minUnit[$scope.tableStats[i].currentMeasurement.unit] == undefined) {
                        minUnit[$scope.tableStats[i].currentMeasurement.unit] = $scope.tableStats[i].min;
                    } else {
                        minUnit[$scope.tableStats[i].currentMeasurement.unit] = ($scope.tableStats[i].min < minUnit[$scope.tableStats[i].currentMeasurement.unit]) ? $scope.tableStats[i].min : minUnit[$scope.tableStats[i].currentMeasurement.unit];
                    }

                    if (maxUnit[$scope.tableStats[i].currentMeasurement.unit] == undefined) {
                        maxUnit[$scope.tableStats[i].currentMeasurement.unit] = $scope.tableStats[i].max;
                    } else {
                        maxUnit[$scope.tableStats[i].currentMeasurement.unit] = ($scope.tableStats[i].max > maxUnit[$scope.tableStats[i].currentMeasurement.unit]) ? $scope.tableStats[i].max : maxUnit[$scope.tableStats[i].currentMeasurement.unit];
                    }
                }
            }

            for (let k = 0; k < $scope.tableStats.length; k++) {
                if ($scope.tableStats[k].pointId === 'null' || $scope.tableStats[k].pointId === null) continue;
                if ($scope.chartStatusSet["meter"].ymin) {
                    $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = 0;
                } else {
                    $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = minUnit[$scope.tableStats[k].currentMeasurement.unit];
                }
                $scope.chartStatusSet["meter"].charts.options.yAxis[k].max = maxUnit[$scope.tableStats[k].currentMeasurement.unit];
            }
        }

        function getYminMaxOld() {
            var minMax = {};
            for (let i = 0; i < $scope.tableStats.length; i++) {
                if ($scope.tableStats[i].pointId !== 'null' && $scope.tableStats[i].pointId !== null) {
                    // if( minMax.hasOwnProperty($scope.tableStats[i].currentMeasurement.id_name)){
                    if (minMax.min == undefined) minMax.min = $scope.tableStats[i].min;
                    else minMax.min = ($scope.tableStats[i].min < minMax.min) ? $scope.tableStats[i].min : minMax.min;
                    if (minMax.max == undefined) minMax.max = $scope.tableStats[i].max;
                    else minMax.max = ($scope.tableStats[i].max > minMax.max) ? $scope.tableStats[i].max : minMax.max;
                    // }
                }
            }
            for (let k = 0; k < $scope.tableStats.length; k++) {
                if ($scope.tableStats[k].pointId === 'null' || $scope.tableStats[k].pointId === null) continue;
                if ($scope.chartStatusSet["meter"].ymin) {
                    $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = 0;
                } else {
                    $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = minMax.min;
                }
                $scope.chartStatusSet["meter"].charts.options.yAxis[k].max = minMax.max;
            }
        }

        function resetYaxes() {
            for (let k = 0; k < $scope.tableStats.length; k++) {
                $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = null;
                $scope.chartStatusSet["meter"].charts.options.yAxis[k].max = null;
                $scope.meterChartConfig1.options.yAxis[k].min = null;
                $scope.meterChartConfig1.options.yAxis[k].max = null;
            }
        }

        function compareFirstNames(a, b) {
            if (a.appServerFilename < b.appServerFilename) {
                return -1;
            }
            if (a.appServerFilename > b.appServerFilename) {
                return 1;
            }
            return 0;
        }
        var deviceTimezone = [{
            'deviceId': 'PRO210223',
            'timeZone': '+09:00',
            'daylight': '+09:00'
        },
        {
            'deviceId': 'PRO210225',
            'timeZone': '+09:00',
            'daylight': '+09:00'
        },
        {
            'deviceId': 'PRO210226',
            'timeZone': '+09:00',
            'daylight': '+09:00'
        },
        {
            'deviceId': 'PRO210227',
            'timeZone': '+09:00',
            'daylight': '+09:00'
        },
        {
            'deviceId': 'PRO210269',
            'timeZone': '+11:00',
            'daylight': '+10:00'
        },
        {
            'deviceId': 'PRO210242',
            'timeZone': '+09:00',
            'daylight': '+09:00'
        },
        {
            'deviceId': 'PRO210267',
            'timeZone': '+10:00',
            'daylight': '+10:00'
        }]
        function getimageURL(seldate, serial_number) {
            $scope.imageFrames = [];
            $scope.imageTimes = [];
            $scope.on_frame = 0;

            if ($scope.isSelectionChanged) {
                $("#noimg_msg").show();
                $(".inner_cstm_slider").hide();
            }

            $.ajax({
                url: 'php/getimageData.php',
                headers: { Accept: 'application/json' },
                success: function (data2) {
                    if($scope.isEmptySmallBoxes) return;
                    var formData = { token: JSON.parse(data2).token, seldate: seldate, serial_number: serial_number };
                    console.log(formData);
                    $.ajax({
                        url: "php/getimageData1.php",
                        type: "POST",
                        data: formData,
                        dataType: 'json',
                        success: function (data3, textStatus, jqXHR) {
                            if (data3 !== null && data3.hasOwnProperty('images') && data3.images.length > 0) {
                                // $scope.imageFrames = ['https://www.slntechnologies.com/wp-content/uploads/2017/08/ef3-placeholder-image.jpg', 'https://cdn3.vectorstock.com/i/1000x1000/35/52/placeholder-rgb-color-icon-vector-32173552.jpg', 'https://image.shutterstock.com/image-vector/ui-image-placeholder-wireframes-apps-260nw-1037719204.jpg'];

                                timezoneObject = _.find(deviceTimezone, { 'deviceId': serial_number });
                                $.each(data3.images, function (key, value) {
                                    $scope.imageFrames.push(`${value.appServerFilepath}/${value.appServerFilename}`);
                                    if (moment(value.timestamp).isBefore('2022-04-03 03:00:00')) {
                                        var timestampInUTC = moment.utc(value.timestamp).utcOffset(timezoneObject.timeZone);
                                    }
                                    else {
                                        var timestampInUTC = moment.utc(value.timestamp).utcOffset(timezoneObject.daylight);
                                    }

                                    var timestampInUTCFmt = timestampInUTC.format('YYYY-MM-DD HH:mm:ss');
                                    $scope.imageTimes.push(timestampInUTCFmt);
                                });
                                $scope.playing = true;
                                $scope.timer;
                                $scope.on_frame = 0;
                                document.getElementById('rangeVal').max = $scope.imageFrames.length - 1;
                                launch();

                                // for (var i = 0; i < $('.owl-carousel').length; i++) {
                                //     $(".owl-item").trigger('remove.owl.carousel', [i])
                                //         .trigger('refresh.owl.carousel');
                                // }
                                // //data3.images.sort( compareFirstNames );
                                // timezoneObject = _.find(deviceTimezone, { 'deviceId': serial_number });

                                // $.each(data3.images, function (key, value) {
                                //     var timestampFull = value.archiveFilename.match(/_(\d{12})/);
                                //     var timestampInUTC = moment.utc(value.timestamp).utcOffset(timezoneObject.timeZone);
                                //     console.log(value.timestamp, 'timezoneObject', timezoneObject.timeZone, timestampInUTC.format('YYYY-MM-DD HH:mm:ss'));
                                //     $('#add').trigger('add.owl.carousel', ['<div class="owl-item"><img class="pic" src=' + value.appServerFilepath + '/' + value.archiveFilename + ' /><div class="datetime">' + timestampInUTC.format('YYYY-MM-DD HH:mm:ss') + '</div></div>']);
                                //     jQuery('.owl-carousel').trigger('refresh.owl.carousel');
                                // });
                                if ($scope.isSelectionChanged) {
                                    $("#noimg_msg").hide();
                                    $(".inner_cstm_slider").show();
                                }
                            }
                            else {
                                // for (var i = 0; i < $('.owl-carousel').length; i++) {
                                //     $(".owl-item").trigger('remove.owl.carousel', [i])
                                //         .trigger('refresh.owl.carousel');
                                // }
                                if ($scope.isSelectionChanged) {
                                    $("#noimg_msg").show();
                                    $(".inner_cstm_slider").hide();
                                }
                                // $('#add').trigger('add.owl.carousel', ['<div class="owl-item"></div>']);
                                // jQuery('.owl-carousel').trigger('refresh.owl.carousel');
                            }
                            //data - response from server
                        },
                        error: function (jqXHR, textStatus, errorThrown) {

                        }
                    });

                }
            });
        }
        var slider = document.getElementById("rangeVal");
        var progressHvrImgCont = document.getElementById("progressHvrImgCont");
        var sliderWidth = slider.offsetWidth - 1;
        $scope.autoRepeatImage = true;

        function launch() {
            document.getElementById('film').src = $scope.imageFrames[$scope.on_frame];
            document.getElementById('actionbutton').addEventListener('click', play);
            document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
            // play();
        }
        function change() {
            if ($scope.on_frame == $scope.imageFrames.length) { $scope.on_frame = 0; }
            // document.getElementById('film').src = $scope.imageFrames[$scope.on_frame];
            $('#film').attr('src', $scope.imageFrames[$scope.on_frame]);
            document.getElementById('rangeVal').value = $scope.on_frame;
            document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
            document.getElementById('rangeVal').max = $scope.imageFrames.length - 1;
            document.getElementById('progressHvrImg').src = $scope.imageFrames[$scope.on_frame];
            if ($scope.playing) {
                if (!$scope.autoRepeatImage && $scope.on_frame === $scope.imageFrames.length - 1) {
                    $scope.stop();
                } else {
                    $scope.timer = setTimeout(change, document.getElementById('framerate').value ? document.getElementById('framerate').value : 250);
                }
            }
            $scope.on_frame++;
        }
        function gotoframe() {
            if ($scope.on_frame == $scope.imageFrames.length) { $scope.on_frame = 0; }
            document.getElementById('film').src = $scope.imageFrames[$scope.on_frame]; //I have my images in a folder named frames
            document.getElementById('rangeVal').value = $scope.on_frame;
            document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
            document.getElementById('rangeVal').max = $scope.imageFrames.length - 1;
            document.getElementById('progressHvrImg').src = $scope.imageFrames[$scope.on_frame];
            if ($scope.playing) {
                pause();
            }
        }
        function play() {
            launch();
            document.getElementById('actionbutton').removeEventListener('click', play);
            document.getElementById('actionbutton').addEventListener('click', pause);
            document.getElementById('actionbutton').innerHTML = 'Pause';
            clearInterval($scope.timer);
            $scope.playing = true;
            change();
        }
        function pause() {
            document.getElementById('actionbutton').removeEventListener('click', pause);
            document.getElementById('actionbutton').addEventListener('click', play);
            document.getElementById('actionbutton').innerHTML = 'Play';
            $scope.playing = false;

        }
        $scope.stop = function () {
            document.getElementById('actionbutton').removeEventListener('click', pause);
            document.getElementById('actionbutton').addEventListener('click', play);
            document.getElementById('actionbutton').innerHTML = 'Play';
            $scope.playing = false;
            $scope.on_frame = 0;
            document.getElementById('rangeVal').value = $scope.on_frame;
            document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
        }

        $scope.previousImage = function () {
            if ($scope.on_frame > 0) {
                $scope.on_frame = $scope.on_frame - 1;
                document.getElementById('rangeVal').value = $scope.on_frame;
                document.getElementById('film').src = $scope.imageFrames[$scope.on_frame];
                document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
            }
        }
        $scope.nextImage = function () {
            if ($scope.on_frame < $scope.imageFrames.length - 1) {
                $scope.on_frame = $scope.on_frame + 1;
                if(Number($scope.on_frame) >= Number(slider.max)) {
                    $scope.on_frame = slider.max;
                }
                document.getElementById('rangeVal').value = $scope.on_frame;
                document.getElementById('film').src = $scope.imageFrames[$scope.on_frame];
                document.getElementById('currentImgTime').innerText = $scope.imageTimes[$scope.on_frame];
            }
        }

        $scope.autoRepeat = function (autoRepeatImage) {
            $scope.autoRepeatImage = autoRepeatImage;
        }

        slider.addEventListener('mousemove', function (event) {
            currentMouseXPos = (event.offsetX - Math.round(progressHvrImgCont.offsetWidth / 2));
            var sliderValAtPos = Math.round((event.offsetX / event.target.clientWidth) *  parseInt(event.target.getAttribute('max'),10));
            if (sliderValAtPos < 0) sliderValAtPos = 0;
            if (Number(sliderValAtPos) >= Number(slider.max)) sliderValAtPos = slider.max;

            document.getElementById('progressHvrImg').src = $scope.imageFrames[sliderValAtPos];
            document.getElementById('progressHvrTime').innerText = $scope.imageTimes[sliderValAtPos];
            progressHvrImgCont.style.left = currentMouseXPos + 'px';
            progressHvrImgCont.style.display = 'block';
        });

        document.getElementById('rangeVal').oninput = function () {
            $scope.on_frame = this.value;
            document.getElementById('progressHvrImg').src = $scope.imageFrames[this.value];
            document.getElementById('progressHvrTime').innerText = $scope.imageTimes[this.value];
            document.getElementById('film').src = $scope.imageFrames[this.value];
            document.getElementById('currentImgTime').innerText = $scope.imageTimes[this.value];
        }

        $scope.downloadImages = function () {
            $scope.loading = true;
            var imageFrames = $scope.imageFrames;
            // window.location = 'php/imageFileVideo.php?imageFrames='+imageFrames+'&isZipDownload=true&isVideoDownload=false';

            $.ajax({
                url: 'php/imageFileVideo.php',
                type: 'POST',
                data: {imageFrames, isZipDownload: true, isVideoDownload: false},
                dataType: 'JSON',
                success: function (response) {
                    var file_path = response.fileName;
                    var a = document.createElement('A');
                    a.href = file_path;
                    a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                },
                complete: function (response) {
                    $scope.loading = false;
                    $scope.$apply();
                }
            });
            return false;
        };

        $scope.downloadVideo = function () {
            $scope.loading = true;
            var imageFrames = $scope.imageFrames;
            // window.location = 'php/imageFileVideo.php?imageFrames=' + imageFrames + '&isZipDownload=false&isVideoDownload=true';
            $.ajax({
                url: 'php/imageFileVideo.php',
                type: 'POST',
                data: {imageFrames, isZipDownload: false, isVideoDownload: true},
                dataType: 'JSON',
                success: function (response) {
                    var file_path = response.fileName;
                    var a = document.createElement('A');
                    a.href = file_path;
                    a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                },
                complete: function (response) {
                    $scope.loading = false;
                    $scope.$apply();
                }
            });
            return false;
        };

        function load_img_chart(isDateChange = false) {
            $scope.$watch("selected", function (node, oldNode) {
                if(!$scope.showScatterPlot) {   
                    let tree_title;

                    if (isDateChange) {
                        if ($rootScope.storage.selectedNodeOriginal) {
                            node = $rootScope.storage.selectedNodeOriginal;
                        }
                    } else {
                        if (node == null) return;
                    }

                    if (node.text !== null || node.text !== 'null') {
                        tree_title = node.text;
                    }

                    if ($scope.imageNodeSelection != node.id || isDateChange == true) {
                        $scope.isSelectionChanged = true;
                    } else {
                        $scope.isSelectionChanged = false;
                    }
                    $scope.imageNodeSelection = node.id;
                    const skySparkFormatwithTime = skySparkFormat+' HH:mm:ss';
                    const query_serial = `html_aTreeNode_get_id_device_02_a( "Gold Coast Water" , "sewerage demo" , "${tree_title}" ,${moment($rootScope.storage.chartsRangeStartDate).format(skySparkFormat)},${moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat)})`;
                    Data.sendRequest(query_serial, $rootScope.storage.skysparkVersion).then(function (response) {
                        const devices = response.data.rows;
                        for(let i=0;i<devices.length;i++) {
                            const serial_number = devices[i].id_serialNumber;
                            const ts_end = devices[i].ts_end.split('+');
                            const ts_start = devices[i].ts_start.split('+');
                            const concate_date = moment(ts_start[0]).format(skySparkFormatwithTime) + ' - ' + moment(ts_end[0]).format(skySparkFormatwithTime);
                            if (serial_number != 'undefined') {
                                getimageURL(concate_date, serial_number,);
                            }
                        }
                    });
                } 
                deselectAllTreeNode("#imageTree");
            });
        }
        function loadData() {
            var datespan = moment($rootScope.storage.chartsRangeStartDate).format(skySparkFormat) + ".." + moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat);
            $scope.queriesArray = [];
            $scope.queriesArray_new = [];
            $scope.tableHeader = [];
            if ($scope.activeItems == undefined) $scope.activeItems = [];
            var activeLength = $scope.activeItems.length;
            for (let i = 0; i < $scope.tableStats.length; i++) {
                if ($scope.tableStats[i].pointId !== 'null' && $scope.tableStats[i].pointId !== null) {
                    $scope.activeItems.push(i);
                    const id = $scope.tableStats[i].pointId;
                    if($scope.tableStats[i].currentMeasurement==null) {
                        // console.log($rootScope.storage.sensorData[0]);
                        $scope.tableStats[i].currentMeasurement = $rootScope.storage.sensorData[i];
                    }
                    const sensorType = $scope.tableStats[i].currentMeasurement.id.split(" ")[0];
                    const interval = $scope.rollup.value;
                    const fold = $scope.tableStats[i].fold.value
;                    const query = `html_plot_chart_06_b([${id}],${sensorType},${datespan},"${fold}",${interval})`;
                    let queryInfo = { query: query, index: i };
                    $scope.queriesArray.push(queryInfo);
                }
            }

            if ($scope.queriesArray.length === 0) return;

            const promises_data = $scope.queriesArray.map(function (item) {
                return Data.sendRequest(item.query, $rootScope.storage.skysparkVersion).then(function (reqResult) {
                    return {
                        'index': item.index,
                        'data': reqResult
                    };
                });
            });

            const data_completion = $q.all(promises_data)

            data_completion.then(function (responses) {

                if (responses.length === 0) return;

                $scope.tableViewData = [];
                for (let p = 0; p < responses[0].data.data.rows.length; p++) {
                    $scope.tableViewData.push([responses[0].data.data.rows[p].ts])
                }

                for (let i = 0; i < responses.length; i++) {
                    const data = responses[i].data.data.rows;
                    const index = parseInt(responses[i].index);
                    $scope.tableStats[index].min = 0;
                    $scope.tableStats[index].avg = "";
                    $scope.tableStats[index].sum = 0;
                    $scope.tableStats[index].data = [];
                    let values = [];
                    let measurements = [];
                    $scope.meterChartConfig1.series[index].data = [];
                    $scope.tableViewData.push([]);
                    const valueName = 'x' + i;
                    let hasValue = false;
                    for (var j = 0; j < data.length; j++) {
                        var ttemp = data[j].ts.slice(0, data[j].ts.indexOf("+"));
                        var mmx = moment.utc(ttemp);
                        const xval = mmx.valueOf();
                        if (data[j].hasOwnProperty("v0")) {
                            hasValue = true;
                            const yval = parseFloat(data[j].v0);
                            measurements.push(yval);
                            values.push([xval, yval]);
                            let dict = {};
                            dict["ts"] = data[j].ts;
                            dict[valueName] = yval
                            $scope.tableViewData[i].push(dict);
                        } else {
                            let dict = {};
                            dict["ts"] = data[j].ts;
                            dict[valueName] = null
                            $scope.tableViewData[i].push(dict);
                            values.push([xval, null]);
                        }
                    }
                    if (hasValue === false) {
                        $scope.tableStats[index].noData = true;
                        continue;
                    } else {
                        $scope.tableStats[index].noData = false;
                    }
                    $scope.tableStats[index].data = values;
                    $scope.tableStats[index].min = Math.min(...measurements);
                    $scope.tableStats[index].max = Math.max(...measurements);
                    const sum = measurements.reduce(function (pre, curr) { return pre + curr; }, 0);
                    $scope.tableStats[index].sum = sum.toFixed(2);
                    $scope.tableStats[index].avg = (sum / measurements.length).toFixed(2);
                    $scope.meterChartConfig1.series[index].data = values;
                    updateSeriesData();

                    if ($scope.tableStats[index].currentMeasurement != null) {
                        $scope.meterChartConfig1.series[index].name = $scope.tableStats[index].title + " - " + $scope.tableStats[index].currentMeasurement.id_name;
                    }

                    $scope.meterChartConfig1.series[index].marker.enabled = $scope.chartStatusSet.meter.markers;
                    $scope.meterChartConfig1.series[index]['tooltip']['pointFormatter'] = function () {
                        return dataPointFormaterFunction(this, $scope.tableStats[index].currentMeasurement);
                    }
                    let sensorName;
                    if ($scope.tableStats[index].currentMeasurement != null) {
                        sensorName = $scope.tableStats[index].currentMeasurement.id_name;

                        /* $scope.meterChartConfig1.options.yAxis[index].labels['formatter'] = 	function(){
                            return yAxisLabelFormaterFunction(this,$scope.tableStats[index].currentMeasurement.kind,$scope.tableStats[index].currentMeasurement.id_name,$scope.tableStats[index].currentMeasurement.unit);
                        } */
                    }
                    if (sensorName === 'Flow Switch' || sensorName === 'Door Switch' || sensorName === 'Flow Valve') {
                        $scope.meterChartConfig1.options.yAxis[index].tickWidth = 0;
                    } else {
                        $scope.meterChartConfig1.options.yAxis[index].tickWidth = 2;
                    }
                }
                const filteredNoData = $scope.tableStats.filter((element) => {
                    if (element.noData === false) {
                        return element
                    }
                });
                if (filteredNoData.length === 0) {
                    resetYaxes();
                    return;
                }
                getYminMax();
                const map = new Map();
                $scope.tableViewData[0].forEach(item => map.set(item.ts, item));
                for (let i = 1; i < $scope.tableViewData.length; i++) {
                    $scope.tableViewData[i].forEach(item => map.set(item.ts, { ...map.get(item.ts), ...item }));
                }
                let mergedArr = Array.from(map.values());
                $scope.tableViewData = [];
                $scope.tableViewData = mergedArr.sort((a, b) => a.ts < b.ts);
            });
        }

        function seriesClickChangeImage(e) {
            var clickedDate = 0;
            if (e.xAxis != undefined) clickedDate = e.xAxis[0].value;
            if (e.point != undefined) clickedDate = e.point.x;
            gotoframeUsingTimeMili(clickedDate);
        }

        function gotoframeUsingTimeMili(clickedDate) {
            var clickedDateO = Highcharts.dateFormat('%Y-%m-%d', clickedDate);
            var clickedDateH = 1*Highcharts.dateFormat('%H', clickedDate);
            var clickedDateM = 1*Highcharts.dateFormat('%M', clickedDate);
            var gotoImgOwl = null;
            var isBreak = false;
            for (var i = 0; i < $scope.imageTimes.length; i++) {
                gotoImgOwl = i;
                var dateTimeOdate = $scope.imageTimes[i].split(':');
                var dateTimeWithHour = dateTimeOdate[0].split(' ');
                var dateTimeWithMin = 1*dateTimeOdate[1];

                if (clickedDateO == dateTimeWithHour[0] && ((clickedDateH == dateTimeWithHour[1] && clickedDateM <= dateTimeWithMin) || clickedDateH < dateTimeWithHour[1])) {
                    isBreak = true;
                    break;
                }
            }
            if(!isBreak) gotoImgOwl = null;
            if (gotoImgOwl != null && gotoImgOwl >= 0) {
                $scope.on_frame = gotoImgOwl;
                gotoframe();
                // jQuery('.owl-carousel').trigger('to.owl.carousel', gotoImgOwl);
            }
        }


        $scope.meterChartConfig1 = {
            options: {
                lang: {
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
                    formatter: function () {
                        return tooltipFormaterFunction(this, "number", null);
                    },
                    shared: true,
                    crosshairs: {
                        color: 'black',
                        dashStyle: 'solid'
                    },
                },
                chart: {
                    type: 'line',
                    zoomType: 'xy',
                    events: {
                        click: seriesClickChangeImage
                    }
                },
                plotOptions: {
                    series: {
                        connectNulls: true
                    },
                    line: {
                        allowPointSelect: true,
                        point: {
                            events: {
                                click: seriesClickChangeImage
                            }
                        }
                    }
                },
                yAxis: [{
                    tickColor: $scope.tableStats[0].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[0].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[0].colour
                        }
                    }
                }, {
                    opposite: true,
                    tickColor: $scope.tableStats[1].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[1].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[1].colour
                        }
                    }
                }, {
                    tickColor: $scope.tableStats[2].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[2].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[2].colour
                        }
                    }
                }, {
                    opposite: true,
                    tickColor: $scope.tableStats[3].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[3].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[3].colour
                        }
                    }
                }, {
                    tickColor: $scope.tableStats[4].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[4].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[4].colour
                        }
                    }
                }, {
                    opposite: true,
                    tickColor: $scope.tableStats[5].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[5].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[5].colour
                        }
                    }
                }, {
                    tickColor: $scope.tableStats[6].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[6].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[6].colour
                        }
                    }
                }, {
                    opposite: true,
                    tickColor: $scope.tableStats[7].colour,
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: $scope.tableStats[7].colour,
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    title: {
                        text: " "
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: $scope.tableStats[7].colour
                        }
                    }
                }],
                xAxis: {
                    gridLineWidth: 2,
                    tickColor: gridTickColor,
                    gridLineColor: gridTickColor,
                    tickWidth: 2,
                    minPadding: 0,
                    maxPadding: 0,
                    showFirstLabel: false,
                    type: 'datetime',
                    tickInterval: null,
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: 'black'
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
            series: [{
                lineWidth: 3,
                yAxis: 0,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                data: [],
                name: '',
                color: $scope.tableStats[0].colour,
                id: 'One',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 1,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Two',
                color: $scope.tableStats[1].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 2,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Three',
                color: $scope.tableStats[2].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 3,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Four',
                color: $scope.tableStats[3].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 4,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Five',
                color: $scope.tableStats[4].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 5,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Six',
                color: $scope.tableStats[5].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 6,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Seven',
                color: $scope.tableStats[6].colour,
                data: [],
                name: '',
                tooltip: {}
            },
            {
                lineWidth: 3,
                yAxis: 7,
                marker: {
                    symbol: 'circle',
                    enabled: false
                },
                id: 'Eight',
                color: $scope.tableStats[7].colour,
                data: [],
                name: '',
                tooltip: {}
            }
            ],
            title: {
                text: ''
            }
        };

        $scope.chartStatusSet = {
            meter: {
                charts: $scope.meterChartConfig1,
                gridlines: true,
                ymin: false,
                markers: false
            },
        };

        function deselectAllTreeNode(treeid) {
            $scope.selected = null;
            if ($scope.activeSelectionFromTree != '') {
                $timeout(function () {
                    var actSelFromTree = $('li[aria-labelledby="' + $scope.activeSelectionFromTree + '_anchor"]');
                    actSelFromTree.children('.jstree-anchor').children('.jstree-checkbox').addClass('jstree-undetermined');
                    actSelFromTree = actSelFromTree.parent().parent();
                    actSelFromTree.children('.jstree-anchor').children('.jstree-checkbox').addClass('jstree-undetermined');
                    actSelFromTree = actSelFromTree.parent().parent();
                    actSelFromTree.children('.jstree-anchor').children('.jstree-checkbox').addClass('jstree-undetermined');
                }, 300);
            }
            $(treeid).jstree("deselect_all");
        }

        $timeout(function () {
            $scope.selectLegend(currentLegend);
        }, 100);

        let chartInterval = null;

        node_select();
        $scope.startInterval = function (useTimeoutDelay) {
            if (chartInterval) return;
            //     ngOnInit() {
            //         loadData();
            //    }
            if(useTimeoutDelay == true) setTimeout(loadData, 500);
            else loadData();
            chartInterval = $interval(loadData, 300 * 1000);//5minutes 300 * 1000
        }

        $scope.cancelInterval = function () {
            if (chartInterval) {
                $interval.cancel(chartInterval);
                chartInterval = null;
            }
        }

        $scope.$on('$destroy', function () {
            $scope.cancelInterval();
        });

        $scope.startInterval();
        load_img_chart();
    })

    .directive('jstreeimage', function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                scope.$on("treeimageready", function () {
                    $(element).jstree({
                        "core": {
                            'check_callback': true,
                            "multiple": false,
                            "themes": {
                                "name": "default",
                                "dots": false,
                                "icons": false
                            },
                            "data": scope.imageTreeData
                        },
                        "checkbox": {
                            "three_state": true,
                            "tie_selection": true
                        },
                        "plugins": ["search", "checkbox"]
                    }, false)
                        .bind("loaded.jstree", function (event, data) {
                            $(this).jstree("open_all");
                            $(this).jstree("select_node", ['@29cd0ed2-43b2f4dc'], true);
                        })
                        .bind('select_node.jstree', function (e, data) {
                            scope.$emit("checkedRef", data.node.text);
                            scope.selected = data.node.original;
                            $rootScope.storage.selectedNodeOriginal = data.node.original;
                            scope.$apply();
                        })
                        .bind('deselect_node.jstree', function (e) {
                            console.log(e);
                        })
                });
            }
        };
    })

function changeDateRange(datapickerId, direction, start, end, format) {
    //one day
    if (moment(start).isSame(moment(end), "day")) {
        if (direction == "left") {
            start = moment(start).subtract(1, "day");
            end = moment(end).subtract(1, "day");
        } else {
            start = moment(start).add(1, "day");
            end = moment(end).add(1, "day");
        }
        $(datapickerId + ' span').html(moment(start).format(format));
    } else { //more than one day
        var tempdiff = moment(end).diff(moment(start), 'days') + 1;
        if (direction == "left") {
            start = moment(start).subtract(tempdiff, "day");
            end = moment(end).subtract(tempdiff, "day");
        } else {
            start = moment(start).add(tempdiff, "day");
            end = moment(end).add(tempdiff, "day");
        }
        $(datapickerId + ' span').html(moment(start).format(format) + ' - ' + moment(end).format(format));
    }
    $(datapickerId).data('daterangepicker').setStartDate(moment(start));
    $(datapickerId).data('daterangepicker').setEndDate(moment(end));

    return [start, end];
}
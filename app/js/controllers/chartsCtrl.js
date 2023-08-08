angular
  .module("chartsCtrl", [])

  .controller(
    "chartsController",
    function (
      $scope,
      $rootScope,
      Data,
      $q,
      $http,
      $timeout,
      $interval,
      $window
    ) {
      const isButtonVisible = true;
      const dataPickerFormat = "D/MM/YYYY";
      const skySparkFormat = "YYYY-MM-DD";
      const gridTickColor = "#b9b9b9";
      $scope.sensorType = "";

      var currentLegend = 0;

      $scope.data_table_meter_page = [];

      $scope.chartIntervalFilter = [...$rootScope.intervalFilter];
      $scope.chartIntervalFilter.unshift({
        name: "1 min",
        value: "1min",
      });

      $scope.rollup =
        $scope.chartIntervalFilter[$rootScope.storage.selectedRollupIndex];

      $scope.options = {
        aoColumns: [
          {
            sTitle: "Timestamp",
          },
          {
            sTitle: "v0",
          },
          {
            sTitle: "v1",
          },
          {
            sTitle: "v2",
          },
          {
            sTitle: "v3",
          },
          {
            sTitle: "v4",
          },
          {
            sTitle: "v5",
          },
          {
            sTitle: "v6",
          },
          {
            sTitle: "v7",
          },
        ],
        aoColumnDefs: [
          {
            bSortable: true,
            aTargets: [0, 1],
          },
        ],
        bJQueryUI: true,
        bDestroy: true,
        aaData: [["", "", "", "", "", "", "", "", ""]],
      };

      $scope.chartTreeData = $rootScope.storage.treeData;
      if ($scope.chartTreeData.length > 0) {
        $timeout(function () {
          $scope.$broadcast("treechartready");
        }, 100);
      }

      $rootScope.$watch("storage.treeData", function (newVal, oldVal) {
        if (newVal == undefined) return;
        if (oldVal == undefined) return;
        if ((newVal.length === 0 && oldVal.length === 0) || newVal === oldVal)
          return;
        $scope.chartTreeData = newVal;
        $scope.$broadcast("treechartready");
      });

      $rootScope.$watch("storage.sensorData", function (newVal, oldVal) {
        if (newVal == undefined) return;
        if (oldVal == undefined) return;
        if ((newVal.length === 0 && oldVal.length === 0) || newVal === oldVal)
          return;
        if (!$scope.$$phase) $scope.$apply();
      });

      // Weeksdays Start
      $scope.weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
      $scope.availableWeekdays = {};
      for (var i = 0; i < $scope.weekdays.length; i++) {
        $scope.availableWeekdays[$scope.weekdays[i]] = true;
      }

      function updateSeriesData() {
        var isReloadChart = false;
        for (var i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId != null &&
            $scope.tableStats[i].pointId != "null"
          ) {
            var weekData = [];
            for (var j = 0; j < $scope.tableStats[i].data.length; j++) {
              var currWday = moment
                .utc($scope.tableStats[i].data[j][0])
                .format("ddd")
                .toUpperCase();
              if ($scope.availableWeekdays[currWday] == true) {
                weekData.push($scope.tableStats[i].data[j]);
              }
            }
            $scope.meterChartConfig.series[i].data = weekData;
            isReloadChart = true;
          }
        }
        return isReloadChart;
      }

      $scope.toogleWeekDays = function (weekday) {
        $scope.availableWeekdays[weekday] = !$scope.availableWeekdays[weekday];
        if (updateSeriesData()) getYminMax();
      };
      // Weeksdays End
      const loadingScatter = "Loading...";
      const noDataTxtScatter = "No Data Recorded.";
      $scope.scatterChartConfig = {};
      $scope.scatterChartConfigCount = [];
      $scope.activeScatterChart = "";

      $scope.$watch("selected", function (newNode) {
        if (newNode == undefined || newNode == null || newNode == "null")
          return;
        $scope.scatterChartConfig[newNode.id] = {
          options: {
            lang: {
              noData: noDataTxtScatter,
            },
            noData: {
              style: {
                fontWeight: "bold",
                fontSize: "16px",
                color: "#303030",
              },
            },
            exporting: {
              enabled: false,
            },
            chart: {
              type: "scatter",
              spacing: [5, 2, 2, 2],
              zoomType: "xy",
            },
            yAxis: {
              title: {
                text: "Level (mm)",
              },
              min: 0,
              startOnTick: true,
              endOnTick: true,
              showLastLabel: true,
            },
            xAxis: {
              title: {
                enabled: true,
                text: "Velocity (m/s)",
              },
              min: 0,
              startOnTick: true,
              endOnTick: true,
              showLastLabel: true,
            },
            credits: {
              enabled: false,
            },
            legend: {
              enabled: false,
            },
            plotOptions: {
              series: {
                color: "#3255A2",
                turboThreshold: 0,
              },
              scatter: {
                marker: {
                  radius: 2,
                  states: {
                    inactive: {
                      opacity: 1,
                    },
                    hover: {
                      enabled: true,
                      lineColor: "rgb(100,100,100)",
                    },
                  },
                },
                states: {
                  hover: {
                    marker: {
                      enabled: false,
                    },
                  },
                },
                tooltip: {
                  headerFormat:
                    '<b style="color:#3255A2">Level v/s Velocity</b><br/>',
                  pointFormat:
                    "<b>{point.name}</b><br/>{point.x} mm, {point.y} m/s",
                },
              },
            },
          },
          title: {
            text: newNode.text.substring(0, 38),
            margin: 5,
          },
          series: [
            {
              data: [],
            },
          ],
          frmDate: "",
          toDate: "",
          cachedData: [],
        };
        $scope.scatterChartConfigCount = Object.keys($scope.scatterChartConfig);

        $scope.activeScatterChart = newNode.id;
        if ($scope.showScatterPlot) $scope.displayScatterPlot();
      });

      $scope.showScatterPlot = false;
      $scope.optionGridToOne = [
        {
          value: 1,
          label: "One at a Time",
        },
        {
          value: 2,
          label: "Grid",
        },
      ];
      $scope.showGridToOne = $scope.optionGridToOne[0];

      $scope.toggleScatterPlot = function () {
        for (let idx in $scope.scatterChartConfig) {
          if ($scope.showScatterPlot) {
            $scope.scatterChartConfig[idx].series[0].data = [];
          } else {
            $scope.scatterChartConfig[idx].options.lang.noData = loadingScatter;
          }
        }
        $scope.showScatterPlot = !$scope.showScatterPlot;
        if ($scope.showScatterPlot) {
          adjustGridToOne();
          $timeout(function () {
            $scope.displayScatterPlot();
          }, 500);
        }
      };

      $scope.setAsActiveScatter = function (idx) {
        $scope.activeScatterChart = idx;
        $scope.displayScatterPlot();
      };
      function adjustGridToOne() {
        let wFact = 1;
        let hFact = 1;
        if ($scope.showGridToOne.value == 2) {
          if ($scope.scatterChartConfigCount.length == 4) {
            wFact = hFact = 2;
          } else {
            hFact =
              $scope.scatterChartConfigCount.length <= 3
                ? 1
                : $scope.scatterChartConfigCount.length <= 6
                ? 2
                : 3;
            wFact =
              $scope.scatterChartConfigCount.length >= 3
                ? 3
                : $scope.scatterChartConfigCount.length;
          }
        }
        const spCW =
          (document.getElementById("scatterPlotCaontainer").clientWidth - 18) /
          wFact;
        const spCH =
          (document.getElementById("scatterPlotCaontainer").clientHeight - 50) /
          hFact;
        for (let idx in $scope.scatterChartConfig) {
          $scope.scatterChartConfig[idx].options.chart.width = spCW;
          $scope.scatterChartConfig[idx].options.chart.height = spCH;
        }
      }

      $scope.$watch("showGridToOne", function () {
        adjustGridToOne();
      });

      $scope.displayScatterPlot = function () {
        let queriesArray = [];
        let frmDate = moment($rootScope.storage.chartsRangeStartDate).format(
          skySparkFormat
        );
        let toDate = moment($rootScope.storage.chartsRangeEndDate).format(
          skySparkFormat
        );
        adjustGridToOne();
        for (let idx in $scope.scatterChartConfig) {
          if (
            $scope.scatterChartConfig[idx].frmDate != frmDate ||
            $scope.scatterChartConfig[idx].toDate != toDate ||
            $scope.scatterChartConfig[idx].cachedData.length == 0
          ) {
            queriesArray.push({
              index: idx,
              query: `html_aTreeNode_scatterplot_hisRead_01_a(${idx},${frmDate},${toDate})`,
            });
            $scope.scatterChartConfig[idx].frmDate = frmDate;
            $scope.scatterChartConfig[idx].toDate = toDate;
            $scope.scatterChartConfig[idx].cachedData = [];
            $scope.scatterChartConfig[idx].series[0].data = [];
          } else {
            $scope.scatterChartConfig[idx].series[0].data =
              $scope.scatterChartConfig[idx].cachedData;
          }
        }

        const promises_data = queriesArray.map(function (item) {
          return Data.sendRequest(
            item.query,
            $rootScope.storage.skysparkVersion
          ).then(function (reqResult) {
            return {
              idx: item.index,
              data: reqResult.data,
            };
          });
        });
        $q.all(promises_data).then(function (responses) {
          if (responses.length !== queriesArray.length) return;

          for (let j = 0; j < responses.length; j++) {
            let serialData = [];
            for (let i = 0; i < responses[j].data.rows.length; i++) {
              let tempEach = { name: "", x: "", y: "" };
              if (responses[j].data.rows[i].ts != undefined) {
                tempEach.name = moment
                  .utc(responses[j].data.rows[i].ts.split("+")[0])
                  .format("D/M/YYYY h:mma");
              }
              if (responses[j].data.rows[i].level1 != undefined)
                tempEach.y = responses[j].data.rows[i].level1;
              if (responses[j].data.rows[i].velocity1 != undefined)
                tempEach.x = responses[j].data.rows[i].velocity1;
              if (tempEach.x != "") serialData.push(tempEach);
            }
            $scope.scatterChartConfig[responses[j].idx].series[0].data =
              serialData;
            $scope.scatterChartConfig[responses[j].idx].cachedData = serialData;
            $scope.scatterChartConfig[responses[j].idx].options.lang.noData =
              noDataTxtScatter;
          }
        });
      };
      // Scatter Plot Done

      $scope.flowReportBtn = true;
      $scope.flowReportEnable = false;
      $scope.flowReportLoader = false;
      $scope.flowReportTypes = [
        {
          value: 1,
          label: "Summary Report",
        },
        {
          value: 2,
          label: "Daily Summaries Report 1",
        },
        {
          value: 3,
          label: "Daily Summaries Report 2",
        },
        {
          value: 4,
          label: "Hourly Report 1",
        },
        {
          value: 5,
          label: "Hourly Report 2",
        },
      ];
      $scope.flowReportTypeSel = $scope.flowReportTypes[0];
      $scope.flowSensorData = [];
      $scope.flowReportRangeStartDate = $rootScope.storage.chartsRangeStartDate;
      $scope.flowReportRangeEndDate = $rootScope.storage.chartsRangeEndDate;
      $scope.flowReportComments = "";
      $scope.flowReportNode = "";

      function isShowFlowReportButton() {
        let queriesArray = [];
        $scope.flowReportRangeStartDate =
          $rootScope.storage.chartsRangeStartDate;
        $scope.flowReportRangeEndDate = $rootScope.storage.chartsRangeEndDate;
        let frmDate = moment($scope.flowReportRangeStartDate).format(
          skySparkFormat
        );
        let toDate = moment($scope.flowReportRangeEndDate).format(
          skySparkFormat
        );
        for (var i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId == null ||
            $scope.tableStats[i].pointId == "null"
          )
            continue;
          let query = `html_aTreeNode_get_id_device_02_a( "Gold Coast Water", "TracNet Yarra Valley", 
                "${$scope.tableStats[i].title}" , ${frmDate} , ${toDate} ).map( r => set( r , "productModel" , 
                r->productRef->productModelRef->modelId ) )`;
          queriesArray.push({ index: i, query: query });
        }
        if (queriesArray.length > 0) {
          let promises_data = queriesArray.map(function (item) {
            return Data.sendRequest(
              item.query,
              $rootScope.storage.skysparkVersion
            ).then(function (reqResult) {
              return {
                idx: item.index,
                data: reqResult.data,
              };
            });
          });

          $q.all(promises_data).then(function (responses) {
            if (responses.length !== queriesArray.length) return;
            $scope.flowReportBtn = false;
            for (let j = 0; j < responses.length; j++) {
              for (let k = 0; k < responses[j].data.rows.length; k++) {
                if (
                  responses[j].data.rows[k].productModel ==
                  "TWP-FSPRO-2AV-RAD-8C"
                ) {
                  $scope.flowReportBtn = true;
                  $scope.flowReportNode =
                    $scope.tableStats[responses[j].idx].title;
                  j = responses.length;
                  break;
                }
              }
            }
          });
        } else {
          $scope.flowReportBtn = false;
        }
      }
      function flowSensorDataSetup() {
        $scope.flowSensorData = [];
        for (let inc = 0; inc < $rootScope.storage.sensorData.length; inc++) {
          let item = $rootScope.storage.sensorData[inc];
          item.checked = item.id_name.search("Flow") != -1;
          if (
            item.id_name.search("Level") != -1 ||
            item.id_name.search("Velocity") != -1 ||
            item.id_name.search("Flow") != -1 ||
            item.id_name.search("Battery") != -1
          ) {
            $scope.flowSensorData.push(item);
          }
        }
      }

      flowSensorDataSetup();

      $scope.$watch("selected", function (newNode) {
        flowSensorDataSetup();
        if (newNode == undefined || newNode == null || newNode == "null")
          return;
        $timeout(function () {
          isShowFlowReportButton();
        }, 100);
      });

      $scope.selectFlowRepSensor = function (idx) {
        for (let i = 0; i < $scope.flowSensorData.length; i++)
          $scope.flowSensorData[i].checked = i == idx;
        $scope.exportFlowReport();
      };

      $scope.toggleFlowRepModel = function (reset) {
        $scope.flowReportEnable = !$scope.flowReportEnable;
        if ($scope.flowReportEnable) {
          $scope.flowReportRangeStartDate =
            $rootScope.storage.chartsRangeStartDate;
          $scope.flowReportRangeEndDate = $rootScope.storage.chartsRangeEndDate;
          changeDatePickerShow(
            "#flowReportRange",
            $scope.flowReportRangeStartDate,
            $scope.flowReportRangeEndDate,
            dataPickerFormat
          );
          if (reset == 1) flowSensorDataSetup();
          $scope.exportFlowReport();
        }
      };

      $scope.exportFlowReport = function (caseType) {
        if (typeof caseType == undefined || caseType == null) caseType = 0;
        let sensorText = [];
        let deviceText = $scope.flowReportNode;
        let sensor_id_name = "";
        for (let i = 0; i < $scope.flowSensorData.length; i++) {
          if ($scope.flowSensorData[i].checked) {
            sensor_id_name = $scope.flowSensorData[i].id_name;
            sensorText.push("Flo");
          }
        }
        let queryPart = `aTreeNode_hisRead_02_a( read( aTreeNode and textLabel == "${deviceText}" and aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" and aTreeRef->aPortalRef->id_name == "TracNet Master Network" )->id , read( aSensorType and id_name == "${sensor_id_name}" )->id , dateTime( ##FDATE## , time( 0 , 0 , 0 ) , read( aTreeNodeLocation and aTreeNodeRef->textLabel == "${deviceText}"and aTreeNodeRef->aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" and aTreeNodeRef->aTreeRef->aPortalRef->id_name == "TracNet Master Network
            " )->aLocationRef->tz )..dateTime( ##TDATE## , time( 0 , 0 , 0 ) , read( aTreeNodeLocation and aTreeNodeRef->textLabel == "${deviceText}" and aTreeNodeRef->aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" and aTreeNodeRef->aTreeRef->aPortalRef->id_name == "TracNet Master Network" )->aLocationRef->tz ) , "##FOLD##" , ##TIMEFRAME## , null , null , read( aTreeNodeLocation and aTreeNodeRef->textLabel == "${deviceText}"and aTreeNodeRef->aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" and aTreeNodeRef->aTreeRef->aPortalRef->id_name == "TracNet Master Network" )->aLocationRef->tz )`;
        let dateList = [];
        dateList.push(
          moment($scope.flowReportRangeStartDate).format("YYYY-MM-DD")
        );
        dateList.push(
          moment($scope.flowReportRangeEndDate).format("YYYY-MM-DD")
        );
        $scope.flowReportLoader = true;
        Data.generatePdf(
          queryPart,
          {
            type: $scope.flowReportTypeSel.value,
            dateList: dateList,
            deviceText: deviceText,
            caseType: caseType,
            sensorText: sensorText,
            comment: $scope.flowReportComments,
          },
          $rootScope.storage.skysparkVersion
        ).then(function (response) {
          if (caseType == 1) {
            var file = new Blob([response.data], { type: "application/pdf" });
            var link = document.createElement("a");
            link.setAttribute("href", window.URL.createObjectURL(file));
            link.setAttribute(
              "download",
              $scope.flowReportTypeSel.label + ".pdf"
            );
            document.body.appendChild(link);
            link.click();
          } else if (caseType == 2) {
            alert(response.data);
          } else {
            $("#reportDataHtml .data .placehere").html(response.data);
          }
          $scope.flowReportLoader = false;
        });
      };

      $("#flowReportRange").daterangepicker(
        {
          dateLimit: {
            years: 5,
          },
          showDropdowns: false,
          timePicker: false,
          timePickerIncrement: 1,
          timePicker12Hour: true,
          opens: "right",
          buttonClasses: ["btn btn-default"],
          applyClass: "btn-small btn-primary",
          cancelClass: "btn-small",
          locale: {
            applyLabel: "Submit",
            fromLabel: "From",
            toLabel: "To",
            customRangeLabel: "Custom Range",
            daysOfWeek: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            monthNames: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            firstDay: 1,
          },
        },
        function (start, end) {
          if (start.isSame(end, "day"))
            $("#flowReportRange span").html(start.format(dataPickerFormat));
          else
            $("#flowReportRange span").html(
              start.format(dataPickerFormat) +
                " - " +
                end.format(dataPickerFormat)
            );

          $scope.flowReportRangeStartDate = start;
          $scope.flowReportRangeEndDate = end;
          $scope.exportFlowReport();
        }
      );

      changeDatePickerShow(
        "#flowReportRange",
        $scope.flowReportRangeStartDate,
        $scope.flowReportRangeEndDate,
        dataPickerFormat
      );

      $scope.changeFlowDateRange = function (direction) {
        var tempA = changeDateRange(
          "#flowReportRange",
          direction,
          $scope.flowReportRangeStartDate,
          $scope.flowReportRangeEndDate,
          dataPickerFormat
        );
        $scope.flowReportRangeStartDate = tempA[0];
        $scope.flowReportRangeEndDate = tempA[1];
        $scope.exportFlowReport();
      };

      // Flow Report

      $("#chartsRange").daterangepicker(
        {
          dateLimit: {
            years: 5,
          },
          showDropdowns: false,
          timePicker: false,
          timePickerIncrement: 1,
          timePicker12Hour: true,
          ranges: {
            Yesterday: [
              moment().subtract("days", 1),
              moment().subtract("days", 1),
            ],
            Today: [moment(), moment()],
            "Last 7 Days": [moment().subtract("days", 6), moment()],
            "Last Week": [
              moment().subtract("week", 1).startOf("week"),
              moment().subtract("week", 1).endOf("week"),
            ],
            "This Week": [moment().startOf("week"), moment().endOf("week")],
            "Last 30 Days": [moment().subtract("days", 29), moment()],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
            "Last Month": [
              moment().subtract("month", 1).startOf("month"),
              moment().subtract("month", 1).endOf("month"),
            ],
          },
          opens: "right",
          buttonClasses: ["btn btn-default"],
          applyClass: "btn-small btn-primary",
          cancelClass: "btn-small",
          locale: {
            applyLabel: "Submit",
            fromLabel: "From",
            toLabel: "To",
            customRangeLabel: "Custom Range",
            daysOfWeek: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            monthNames: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            firstDay: 1,
          },
        },
        function (start, end) {
          if (start.isSame(end, "day"))
            $("#chartsRange span").html(start.format(dataPickerFormat));
          else
            $("#chartsRange span").html(
              start.format(dataPickerFormat) +
                " - " +
                end.format(dataPickerFormat)
            );

          $rootScope.storage.chartsRangeStartDate = start;
          $rootScope.storage.chartsRangeEndDate = end;

          $rootScope.storage.selectedRollupIndex = $rootScope.adjustInterval(
            start,
            end
          );
          $scope.rollup =
            $scope.chartIntervalFilter[$rootScope.storage.selectedRollupIndex];

          $scope.$apply();
          $scope.cancelInterval();
          $scope.startInterval();
        }
      );

      changeDatePickerShow(
        "#chartsRange",
        $rootScope.storage.chartsRangeStartDate,
        $rootScope.storage.chartsRangeEndDate,
        dataPickerFormat
      );

      $scope.changeDateRange = function (direction) {
        var tempA = changeDateRange(
          "#chartsRange",
          direction,
          $rootScope.storage.chartsRangeStartDate,
          $rootScope.storage.chartsRangeEndDate,
          dataPickerFormat
        );
        $rootScope.storage.chartsRangeStartDate = tempA[0];
        $rootScope.storage.chartsRangeEndDate = tempA[1];
        $scope.cancelInterval();
        $scope.startInterval();
      };

      $scope.changeInterval = function () {
        $rootScope.storage.selectedRollupIndex = $rootScope.getIntervalIndex(
          $scope.rollup
        );
        $scope.cancelInterval();
        $scope.startInterval();
      };

      $scope.clearData = function () {
        countNode = [];
        clearChartData();
        setVisible();
        $scope.selectLegend(0);
        $scope.flowReportBtn = false;
        deselectAllTreeNodep("#chartTree");
        $scope.selectedValue = "";
      };

      function clearChartData() {
        for (var i = 0; i < $scope.tableStats.length; i++) {
          $scope.tableStats[i].title = "";
          $scope.tableStats[i].pointId = "null";
          $scope.tableStats[i].measurements = [];
          $scope.tableStats[i].fold = {
            name: "null",
            value: "null",
          };
          $scope.tableStats[i].max = 0;
          $scope.tableStats[i].min = 0;
          $scope.tableStats[i].avg = "";
          $scope.tableStats[i].sum = 0;
          $scope.tableStats[i].data = [];
          $scope.meterChartConfig.series[i].data = [];
          $scope.meterChartConfig.options.yAxis[i].min = null;
          $scope.meterChartConfig.options.yAxis[i].max = null;
          $scope.tableViewData = [];
        }
      }

      function setVisible() {
        for (var i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId == null ||
            $scope.tableStats[i].pointId == "null"
          ) {
            document.getElementById(
              $scope.tableStats[i].hideDivId
            ).style.visibility = "hidden";
            document.getElementById(
              $scope.tableStats[i].hideCloseDivId
            ).style.visibility = "hidden";
          } else {
            document.getElementById(
              $scope.tableStats[i].hideDivId
            ).style.visibility = "visible";
            document.getElementById(
              $scope.tableStats[i].hideCloseDivId
            ).style.visibility = "visible";
          }
        }
      }

      $scope.tableStatArr = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
      ];

      $scope.changeMeasurement = function () {
        $scope.cancelInterval();
        $scope.startInterval();
      };

      $scope.changeFold = function () {
        $scope.cancelInterval();
        $scope.startInterval();
      };

      // set marker default active
      document
        .getElementById("meter" + "_markersButton")
        .setAttribute("class", "btnTopBar");

      $scope.switchGridLine = function (page) {
        $scope.chartStatusSet[page].gridlines =
          !$scope.chartStatusSet[page].gridlines;
        if ($scope.chartStatusSet[page].gridlines) {
          document
            .getElementById(page + "_gridLinesButton")
            .setAttribute("class", "btnTopBar");
          for (
            var i = 0;
            i < $scope.chartStatusSet[page].charts.options.yAxis.length;
            i++
          )
            $scope.chartStatusSet[page].charts.options.yAxis[
              i
            ].gridLineWidth = 2;
          if (page == "meter")
            $scope.chartStatusSet[page].charts.options.xAxis.gridLineWidth = 2;
          else {
            for (
              var i = 0;
              i < $scope.chartStatusSet[page].charts.options.xAxis.length;
              i++
            )
              $scope.chartStatusSet[page].charts.options.xAxis[
                i
              ].gridLineWidth = 2;
          }
        } else {
          document
            .getElementById(page + "_gridLinesButton")
            .setAttribute("class", "btnTopBarOff");
          for (
            var i = 0;
            i < $scope.chartStatusSet[page].charts.options.yAxis.length;
            i++
          )
            $scope.chartStatusSet[page].charts.options.yAxis[
              i
            ].gridLineWidth = 0;
          if (page == "meter")
            $scope.chartStatusSet[page].charts.options.xAxis.gridLineWidth = 0;
          else {
            for (
              var i = 0;
              i < $scope.chartStatusSet[page].charts.options.xAxis.length;
              i++
            )
              $scope.chartStatusSet[page].charts.options.xAxis[
                i
              ].gridLineWidth = 0;
          }
        }

        $timeout(function () {
          showMarkers(page);
        }, 100);
      };

      $scope.switchYmin = function (page) {
        $scope.chartStatusSet[page].ymin = !$scope.chartStatusSet[page].ymin;
        if ($scope.chartStatusSet[page].ymin === true) {
          document
            .getElementById(page + "_yminButton")
            .setAttribute("class", "btnTopBar");
        } else {
          document
            .getElementById(page + "_yminButton")
            .setAttribute("class", "btnTopBarOff");
        }

        getYminMax();
        $timeout(function () {
          showMarkers(page);
        }, 100);
      };

      $scope.switchMarkers = function (page) {
        $scope.chartStatusSet[page].markers =
          !$scope.chartStatusSet[page].markers;
        if ($scope.chartStatusSet[page].markers) {
          document
            .getElementById(page + "_markersButton")
            .setAttribute("class", "btnTopBar");
        } else {
          document
            .getElementById(page + "_markersButton")
            .setAttribute("class", "btnTopBarOff");
        }
        showMarkers(page);
      };

      function showMarkers(page) {
        var chart = $("#chartsMeterCompare").highcharts();
        chart.series[0].update({
          marker: {
            enabled: $scope.chartStatusSet[page].markers,
          },
        });
        chart.series[1].update({
          marker: {
            enabled: $scope.chartStatusSet[page].markers,
          },
        });
        if (page == "meter") {
          chart.series[2].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });
          chart.series[3].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });

          chart.series[4].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });

          chart.series[5].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });

          chart.series[6].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });

          chart.series[7].update({
            marker: {
              enabled: $scope.chartStatusSet[page].markers,
            },
          });
        }
      }

      $scope.download = function (page) {
        var series = $scope.chartStatusSet[page].charts.series;
        downloadCsvFile(series, "meter.csv");
      };

      $scope.myCustomDownload = function () {
        let sDate = localStorage.getItem("startDate");
        let eDate = localStorage.getItem("endDate");
        let nodeId = localStorage.getItem("aTreeNodeId");
        let sensorId = localStorage.getItem("sensorId");
        let downloadUrl =
          "http://127.0.0.1:8000/api/v1/download_chart?aTreeNodeId=" +
          nodeId +
          "&sensorId=" +
          sensorId +
          "&startDate=" +
          sDate +
          "&endDate=" +
          eDate +
          "&fold=actual";

        // Open the URL in a new window or tab to trigger the download
        $window.open(downloadUrl, "_self");
      };

      function downloadCsvFile(series, filename) {
        var tempDataList = [];
        var contents = "ts,";
        for (var i = 0; i < $scope.tableStats.length; i++) {
          if (
            !(
              $scope.tableStats[i].pointId == null ||
              $scope.tableStats[i].pointId == "null"
            )
          )
            contents =
              contents +
              $scope.tableStats[i].title +
              " - " +
              $scope.tableStats[i].currentMeasurement.id_name +
              ",";
        }
        contents = contents.slice(0, contents.length - 1);
        contents = contents + "\n";

        for (var i = 0; i < series.length; i++)
          if (series[i].data.length > 0) tempDataList.push(series[i].data);

        if (tempDataList.length == 0) return;

        var tempArray = tempDataList[0];

        for (var i = 0; i < tempArray.length; i++) {
          contents =
            contents +
            moment.utc(tempArray[i][0]).format("YYYY-MM-DD  HH:mm") +
            ",";
          for (var j = 0; j < tempDataList.length; j++) {
            if (typeof tempDataList[j][i] != "undefined")
              contents = contents + tempDataList[j][i][1] + ",";
          }
          contents = contents.slice(0, contents.length - 1);
          contents = contents + "\n";
        }

        $http
          .post("php/charts/downloadcsv.php", {
            filename: filename,
            contents: contents,
          })
          .then(
            function (data) {
              var hiddenElement = document.createElement("a");
              hiddenElement.href =
                "data:attachment/csv," + encodeURI(data.data);
              hiddenElement.target = "_blank";
              hiddenElement.download = filename;
              document.body.appendChild(hiddenElement);
              hiddenElement.click();
            },
            function (err) {
              console.log(err);
            }
          );
      }

      $scope.switchTable = function (page, visible) {
        $scope.showMeasureTable = visible;
      };

      // $scope.InsIndex = 0

      $scope.selectLegend = function (index) {
        for (var i = 0; i < $scope.tableStats.length; i++) {
          try {
            document.getElementById(
              $scope.tableStats[i].divId
            ).style.borderColor = "#666";
            document.getElementById(
              $scope.tableStats[i].divId
            ).style.borderWidth = "thin";
          } catch (err) {}
        }
        try {
          document.getElementById(
            $scope.tableStats[index].divId
          ).style.borderColor = $scope.tableStats[index].colour;
          document.getElementById(
            $scope.tableStats[index].divId
          ).style.borderWidth = "medium";
          currentLegend = index;
        } catch (err) {}
      };

      $scope.clearNodeData = function (index) {
        $scope.tableStats[index].title = "";
        $scope.tableStats[index].pointId = "null";
        $scope.tableStats[index].measurements = [];
        $scope.tableStats[index].fold = {
          name: "null",
          value: "null",
        };
        $scope.tableStats[index].max = 0;
        $scope.tableStats[index].min = 0;
        $scope.tableStats[index].avg = "";
        $scope.tableStats[index].sum = 0;
        $scope.tableStats[index].data = [];
        $scope.meterChartConfig.series[index].data = [];
        $scope.meterChartConfig.options.yAxis[index].min = null;
        $scope.meterChartConfig.options.yAxis[index].max = null;
        setVisible();
        //setNextCurrentLegend();
        isShowFlowReportButton(index);
      };

      var args;
      $scope.dataLegendFull = false;
      $scope.dataLegendReduced = false;
      $scope.dataLegendMinimal = false;
      $scope.dataLegendNone = false;

      $scope.full = false;
      $scope.reduced = false;
      $scope.minimal = false;
      $scope.none = false;

      $scope.reloadMethod = function () {
        $timeout(function () {
          var refreshChart = $("#chartsMeterCompare").highcharts();

          refreshChart.reflow();
        }, 10);
      };

      $scope.checkstorage = function () {
        var isChecked = localStorage.getItem("isChecked")
          ? localStorage.getItem("isChecked")
          : "full";
        $scope.SizeScreen(isChecked);
      };

      $scope.SizeScreen = function (args) {
        if (args == "full") {
          $scope.dataLegendFull = $scope.dataLegendFull = true;
          $scope.dataLegendReduced = $scope.dataLegendReduced = false;
          $scope.dataLegendMinimal = $scope.dataLegendMinimal = false;
          $scope.dataLegendNone = $scope.dataLegendNone = false;
          localStorage.setItem("isChecked", "full");
          $scope.full = true;
          $scope.reduced = false;
          $scope.minimal = false;
          $scope.none = false;
          $scope.reloadMethod();
        } else if (args == "reduced") {
          $scope.dataLegendReduced = $scope.dataLegendReduced = true;
          $scope.dataLegendMinimal = $scope.dataLegendMinimal = false;
          $scope.dataLegendNone = $scope.dataLegendNone = false;
          localStorage.setItem("isChecked", "reduced");
          $scope.full = false;
          $scope.reduced = true;
          $scope.minimal = false;
          $scope.none = false;
          $scope.reloadMethod();
        } else if (args == "minimal") {
          $scope.dataLegendMinimal = $scope.dataLegendMinimal = true;
          $scope.dataLegendReduced = $scope.dataLegendReduced = true;
          $scope.dataLegendNone = $scope.dataLegendNone = false;
          localStorage.setItem("isChecked", "minimal");
          $scope.full = false;
          $scope.reduced = false;
          $scope.minimal = true;
          $scope.none = false;
          $scope.reloadMethod();
        } else if (args == "none") {
          $scope.dataLegendNone = $scope.dataLegendNone = true;
          $scope.dataLegendReduced = $scope.dataLegendReduced = false;
          $scope.dataLegendMinimal = $scope.dataLegendMinimal = false;
          $scope.dataLegendFull = $scope.dataLegendFull = false;
          localStorage.setItem("isChecked", "none");
          $scope.none = true;
          $scope.full = false;
          $scope.reduced = false;
          $scope.minimal = false;

          $scope.reloadMethod();
        }
      };
      $scope.change = "Distance";
      $scope.getVal = function () {
        $scope.change = $scope.selectedValue;
      };

      $scope.selectedInsCount = 0;
      $scope.compareNode = "";
      $scope.valueAngle = "Distance";
      countNode = [];
      var countInstallation = 0;

      $scope.$watch("selected", function (node) {
        if (typeof node === "undefined" || node === null) {
          return;
        }
        if (!$scope.showScatterPlot) {
          $scope.tableStats[currentLegend].pointId = node._id;
          $scope.tableStats[currentLegend].title = node.text;
          $scope.tableStats[currentLegend].measurements =
            $rootScope.storage.sensorData; //JSON.parse(JSON.stringify($rootScope.storage.sensorData));
          $scope.tableStats[currentLegend].currentMeasurement =
            $scope.tableStats[currentLegend].measurements[0];
          $scope.tableStats[currentLegend].fold =
            $rootScope.foldmethodFilter[0].value;
          document.getElementById(
            $scope.tableStats[currentLegend].hideDivId
          ).style.visibility = "visible";
          document.getElementById(
            $scope.tableStats[currentLegend].hideCloseDivId
          ).style.visibility = "visible";
          setNextCurrentLegend($scope.tableStats);
          $scope.cancelInterval();
          $scope.startInterval();
        }
        deselectAllTreeNode("#chartTree");
      });

      $scope.$watch("selectedValue", function () {
        $scope.tableStats[currentLegend].measurements =
          $rootScope.storage.sensorData;
        if ($scope.selectedValue == "Angle") {
          for (var i = 0; i < $scope.tableStats.length; i++) {
            if ($scope.tableStats[i].title != "") {
              $scope.tableStats[i].currentMeasurement =
                $scope.tableStats[i].measurements[1];
            }
          }
        } else if ($scope.selectedValue == "Distance") {
          for (var i = 0; i < $scope.tableStats.length; i++) {
            if ($scope.tableStats[i].title != "") {
              $scope.tableStats[i].currentMeasurement =
                $scope.tableStats[i].measurements[0];
            }
          }
        } else {
          $scope.tableStats[currentLegend].currentMeasurement =
            $scope.tableStats[currentLegend].measurements[0];
        }

        $scope.cancelInterval();
        $scope.startInterval();
      });

      function setNextCurrentLegend() {
        for (var i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId == "null" ||
            $scope.tableStats[i].pointId == null
          ) {
            $scope.selectLegend(i);
            return;
          }
        }
      }

      function installationCount(insArr, item) {
        return insArr.filter((v) => v === item).length;
      }

      $scope.tableStats = [];
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
          value: "null",
        };
        this.max = 0;
        this.min = 0;
        this.avg = "";
        this.sum = 0;
        this.data = [];
      }

      $scope.readable = function (datatype) {
        let readable;
        if (typeof datatype === undefined || typeof datatype === "undefined")
          return;
        if (typeof datatype == "string") {
          if (datatype != "") {
            readable = moment(datatype.slice(0, datatype.indexOf("+"))).format(
              "Do MMM YYYY HH:mm:ssa"
            );
          }
        } else if (datatype === null) {
          readable = " ";
        } else {
          readable = parseFloat(datatype.toFixed(2));
        }
        return readable;
      };

      function getYminMax() {
        var minUnit = {},
          maxUnit = {};
        for (let i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId !== "null" &&
            $scope.tableStats[i].pointId !== null
          ) {
            if (
              minUnit[$scope.tableStats[i].currentMeasurement.unit] == undefined
            ) {
              minUnit[$scope.tableStats[i].currentMeasurement.unit] =
                $scope.tableStats[i].min;
            } else {
              minUnit[$scope.tableStats[i].currentMeasurement.unit] =
                $scope.tableStats[i].min <
                minUnit[$scope.tableStats[i].currentMeasurement.unit]
                  ? $scope.tableStats[i].min
                  : minUnit[$scope.tableStats[i].currentMeasurement.unit];
            }

            if (
              maxUnit[$scope.tableStats[i].currentMeasurement.unit] == undefined
            ) {
              maxUnit[$scope.tableStats[i].currentMeasurement.unit] =
                $scope.tableStats[i].max;
            } else {
              maxUnit[$scope.tableStats[i].currentMeasurement.unit] =
                $scope.tableStats[i].max >
                maxUnit[$scope.tableStats[i].currentMeasurement.unit]
                  ? $scope.tableStats[i].max
                  : maxUnit[$scope.tableStats[i].currentMeasurement.unit];
            }
          }
        }

        for (let k = 0; k < $scope.tableStats.length; k++) {
          if (
            $scope.tableStats[k].pointId === "null" ||
            $scope.tableStats[k].pointId === null
          )
            continue;
          if ($scope.chartStatusSet["meter"].ymin) {
            $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = 0;
          } else {
            $scope.chartStatusSet["meter"].charts.options.yAxis[k].min =
              minUnit[$scope.tableStats[k].currentMeasurement.unit];
          }
          $scope.chartStatusSet["meter"].charts.options.yAxis[k].max =
            maxUnit[$scope.tableStats[k].currentMeasurement.unit];
        }
      }

      function resetYaxes() {
        for (let k = 0; k < $scope.tableStats.length; k++) {
          $scope.chartStatusSet["meter"].charts.options.yAxis[k].min = null;
          $scope.chartStatusSet["meter"].charts.options.yAxis[k].max = null;
          $scope.meterChartConfig.options.yAxis[k].min = null;
          $scope.meterChartConfig.options.yAxis[k].max = null;
        }
      }

      function loadData() {
        var datespan =
          moment($rootScope.storage.chartsRangeStartDate).format(
            skySparkFormat
          ) +
          ".." +
          moment($rootScope.storage.chartsRangeEndDate).format(skySparkFormat);
        var startDate = moment($rootScope.storage.chartsRangeStartDate).format(
          skySparkFormat
        );
        var endDate = moment($rootScope.storage.chartsRangeEndDate).format(
          skySparkFormat
        );
        localStorage.setItem("startDate", startDate);
        localStorage.setItem("endDate", endDate);
        $scope.queriesArray = [];
        $scope.tableHeader = [];
        $scope.activeItems = [];
        for (let i = 0; i < $scope.tableStats.length; i++) {
          if (
            $scope.tableStats[i].pointId !== "null" &&
            $scope.tableStats[i].pointId !== null
          ) {
            $scope.activeItems.push(i);
            const id = $scope.tableStats[i].pointId;
             $scope.sensorType =
              $scope.tableStats[i].currentMeasurement.id.split(" ")[0];
            localStorage.setItem("aTreeNodeId", id);
            console.log($scope.sensorType,'id sorb')
            localStorage.setItem("sensorId", $scope.sensorType);
            const interval = $scope.rollup.value;
            const fold = $scope.tableStats[i].fold.value;
            const query = `http://127.0.0.1:8000/api/v1/html_plot_chart_06_b?aTreeNodeId=${id}&sensorId=${$scope.sensorType}&startDate=${startDate}&endDate=${endDate}&fold=actual`;
            let queryInfo = { query: query, index: i };
            $scope.queriesArray.push(queryInfo);
          }
        }

        if ($scope.queriesArray.length === 0) return;
        const promises_data = $scope.queriesArray.map(function (item) {
          return $http.get(item.query).then(function (reqResult) {
            return {
              index: item.index,
              data: reqResult,
            };
          });
        });

        const data_completion = $q.all(promises_data);

        data_completion.then(function (responses) {
          if (responses.length === 0) return;
          $scope.tableViewData = [];

          for (let p = 0; p < responses[0].data.data.data.length; p++) {
            $scope.tableViewData.push([responses[0].data.data.data[p].ts]);
          }
          
          for (let i = 0; i < responses.length; i++) {
            const data = responses[i].data.data.data;
            console.log(responses[i].data, "data")
            for (let k = data.length - 1; k >= 0; k--) {
              if($scope.sensorType == "64ae522eefa8baae8f106b9d"){
                console.log("in")
                if (data[k].v0 <= 400) {
                  data[k].v0 = 400;
                  console.log("400")
                } else if (data[k].v0 >= 3998) {
                  console.log("3998")
                    data.splice(k, 1); // Remove the element at index k
                } 
              }
              
              // You don't need the else block here, so it can be omitted.
          }
            const index = responses[i].index;
            $scope.tableStats[index].max = 0;
            $scope.tableStats[index].min = 0;
            $scope.tableStats[index].avg = "";
            $scope.tableStats[index].sum = 0;
            $scope.tableStats[index].data = [];
            let values = [];
            let measurements = [];
            $scope.meterChartConfig.series[index].data = [];
            $scope.tableViewData.push([]);
            const valueName = "x" + i;
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
                dict[valueName] = yval;
                $scope.tableViewData[i].push(dict);
              } else {
                let dict = {};
                dict["ts"] = data[j].ts;
                dict[valueName] = null;
                $scope.tableViewData[i].push(dict);
                values.push([xval, yval]);
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
            const sum = measurements.reduce(function (pre, curr) {
              return pre + curr;
            }, 0);
            $scope.tableStats[index].sum = sum.toFixed(2);
            $scope.tableStats[index].avg = (sum / measurements.length).toFixed(
              0
            );
            updateSeriesData();
            $scope.meterChartConfig.series[index].name =
              $scope.tableStats[index].title +
              " - " +
            $scope.tableStats[index].currentMeasurement.id_name;
            $scope.meterChartConfig.series[index].marker.enabled = $scope.chartStatusSet.meter.markers;
            $scope.meterChartConfig.series[index]["tooltip"]["pointFormatter"] =
              function () {
                return dataPointFormaterFunction(
                  this,
                  $scope.tableStats[index].currentMeasurement
                );
              };
            let sensorName;
            sensorName = $scope.tableStats[index].currentMeasurement.id_name;
            $scope.meterChartConfig.options.yAxis[index].labels["formatter"] =
              function () {
                return yAxisLabelFormaterFunction(
                  this,
                  $scope.tableStats[index].currentMeasurement.kind,
                  $scope.tableStats[index].currentMeasurement.id_name,
                  $scope.tableStats[index].currentMeasurement.unit
                );
              };
            if (
              sensorName === "Flow Switch" ||
              sensorName === "Door Switch" ||
              sensorName === "Flow Valve"
            ) {
              $scope.meterChartConfig.options.yAxis[index].tickWidth = 0;
            } else {
              $scope.meterChartConfig.options.yAxis[index].tickWidth = 2;
            }
          }
          const filteredNoData = $scope.tableStats.filter((element) => {
            if (element.noData === false) {
              return element;
            }
          });
          if (filteredNoData.length === 0) {
            resetYaxes();
            return;
          }
          getYminMax();
          const map = new Map();
          $scope.tableViewData[0].forEach((item) => map.set(item.ts, item));
          for (let i = 1; i < $scope.tableViewData.length; i++) {
            $scope.tableViewData[i].forEach((item) =>
              map.set(item.ts, { ...map.get(item.ts), ...item })
            );
          }
          let mergedArr = Array.from(map.values());
          $scope.tableViewData = [];
          $scope.tableViewData = mergedArr.sort((a, b) => a.ts < b.ts);
        });
      }

      $scope.meterChartConfig = {
        options: {
          lang: {
            noData: "No Data Recorded.",
          },
          noData: {
            style: {
              fontWeight: "bold",
              fontSize: "16px",
              color: "#303030",
            },
          },
          exporting: {
            enabled: false,
          },
          tooltip: {
            formatter: function () {
              return tooltipFormaterFunction(this, "number", null);
            },
            shared: true,
            crosshairs: {
              color: "black",
              dashStyle: "solid",
            },
          },
          chart: {
            type: "line",
            zoomType: "xy",
          },
          plotOptions: {
            series: {
              states: {
                inactive: {
                  opacity: 1,
                },
              },
              connectNulls: true,
            },
          },
          yAxis: [
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[0].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[1].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[2].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[3].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[4].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[5].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[6].colour,
                },
              },
            },
            {
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
                text: " ",
              },
              labels: {
                style: {
                  fontSize: "13px",
                  color: $scope.tableStats[7].colour,
                },
              },
            },
          ],
          xAxis: {
            gridLineWidth: 2,
            tickColor: gridTickColor,
            gridLineColor: gridTickColor,
            tickWidth: 2,
            minPadding: 0,
            maxPadding: 0,
            showFirstLabel: false,
            type: "datetime",
            tickInterval: null,
            labels: {
              style: {
                fontSize: "13px",
                color: "black",
              },
            },
          },
          legend: {
            enabled: false,
          },
          credits: {
            enabled: false,
          },
        },
        series: [
          {
            lineWidth: 3,
            yAxis: 0,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            data: [],
            name: "",
            color: $scope.tableStats[0].colour,
            id: "One",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 1,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Two",
            color: $scope.tableStats[1].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 2,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Three",
            color: $scope.tableStats[2].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 3,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Four",
            color: $scope.tableStats[3].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 4,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Five",
            color: $scope.tableStats[4].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 5,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Six",
            color: $scope.tableStats[5].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 6,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Seven",
            color: $scope.tableStats[6].colour,
            data: [],
            name: "",
            tooltip: {},
          },
          {
            lineWidth: 3,
            yAxis: 7,
            marker: {
              symbol: "circle",
              enabled: false,
            },
            id: "Eight",
            color: $scope.tableStats[7].colour,
            data: [],
            name: "",
            tooltip: {},
          },
        ],
        title: {
          text: "",
        },
      };

      $scope.chartStatusSet = {
        meter: {
          charts: $scope.meterChartConfig,
          gridlines: true,
          ymin: false,
          markers: true,
        },
      };

      function deselectAllTreeNode(treeid) {
        $scope.selected = null;
      }
      function deselectAllTreeNodep(treeid) {
        $scope.selected = null;
        $(treeid)
          .find(".jstree-disabled")
          .each(function () {
            $(treeid).jstree("enable_node", $(".jstree-disabled"));
          });
        return $(treeid).jstree("deselect_all");
      }

      $timeout(function () {
        $scope.selectLegend(currentLegend);
      }, 100);

      let chartInterval = null;

      $scope.startInterval = function () {
        if (chartInterval) return;
        loadData();
        chartInterval = $interval(loadData, 300 * 1000); //5minutes 300 * 1000
      };

      $scope.cancelInterval = function () {
        if (chartInterval) {
          $interval.cancel(chartInterval);
          chartInterval = null;
        }
      };

      $scope.$on("$destroy", function () {
        $scope.cancelInterval();
      });

      $scope.startInterval();

      $scope.startInterval();
      $scope.psleep = function (ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      };
    }
  )

  .directive("jstreechart", function () {
    return {
      restrict: "A",
      link: function (scope, element, attrs) {
        scope.$on("treechartready", function () {
          $(element)
            .jstree(
              {
                core: {
                  check_callback: true,
                  multiple: true,
                  themes: {
                    name: "default",
                    dots: false,
                    icons: false,
                  },
                  data: scope.chartTreeData,
                },
                checkbox: {
                  three_state: true,
                },
                plugins: ["search", "checkbox"],
              },
              false
            )
            .bind("loaded.jstree", function (event, data) {
              $(this).jstree("open_all");
              $(this).jstree("select_node", [""], true);
            })
            .bind("loaded.jstree", function (event, data2) {
              $(this).jstree("open_all");
              $(this).jstree("deselect_node", [""], true);
            })
            .bind("deselect_node.jstree", function (e, data) {
              scope.$emit("checkedRef", data.node.text);
              scope.deselceted = data.node.original;
            })
            .bind("select_node.jstree", async function (e, data) {
              if (data.node.id == "@2b931fe5-f624c0c6") {
                for (i = 0; i < 10; i++) {
                  scope.clearNodeData(i);
                }
                var c = 1;
                for (const children of data.node.children) {
                  if (c <= 10) {
                    childNode = $(this).jstree(true).get_node(children);
                    scope.$emit("checkedRef", childNode.text);
                    await scope.psleep(450);
                    scope.selected = childNode.original;

                    await scope.psleep(500);
                    c = c + 1;
                  }
                }
              } else {
                for (let index = 0; index < data.selected.length; index++) {
                  if (data.node.id === data.selected[index]) {
                    scope.selectedValue = "Distance";
                    $(this).jstree("disable_node", data.node);
                    scope.selectedValue = "Distance";
                  }
                }
                scope.$emit("checkedRef", data.node.text);
                scope.selected = data.node.original;
              }
            });
        });
      },
    };
  });

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
    $(datapickerId + " span").html(moment(start).format(format));
  } else {
    //more than one day
    var tempdiff = moment(end).diff(moment(start), "days") + 1;
    if (direction == "left") {
      start = moment(start).subtract(tempdiff, "day");
      end = moment(end).subtract(tempdiff, "day");
    } else {
      start = moment(start).add(tempdiff, "day");
      end = moment(end).add(tempdiff, "day");
    }
    $(datapickerId + " span").html(
      moment(start).format(format) + " - " + moment(end).format(format)
    );
  }
  $(datapickerId).data("daterangepicker").setStartDate(moment(start));
  $(datapickerId).data("daterangepicker").setEndDate(moment(end));

  return [start, end];
}

function changeDatePickerShow(datapickerId, start, end, format) {
  if (moment(start).isSame(moment(end), "day"))
    $(datapickerId + " span").html(moment(start).format(format));
  else
    $(datapickerId + " span").html(
      moment(start).format(format) + " - " + moment(end).format(format)
    );
  if (start != null)
    $(datapickerId).data("daterangepicker").setStartDate(moment(start));
  if (end != null)
    $(datapickerId).data("daterangepicker").setEndDate(moment(end));
}

angular
  .module("settingsCtrl", [])

  .controller(
    "settingsController",
    function (
      $scope,
      $rootScope,
      Data,
      $http,
      $timeout,
      $window,
      $state,
      $location
    ) {
      const portalRef = "64ad1af2664396439a286273";
      let selectedNodeLabel;
      let selectedProduct;

      $scope.loading = false;
      $scope.operationResult = false;

      $scope.settingsTreeData = $rootScope.storage.treeData;
      if ($scope.settingsTreeData.length > 0) {
        $timeout(function () {
          $scope.$broadcast("treesettingsready");
        }, 100);
      }

      $rootScope.$watch("storage.treeData", function (newVal, oldVal) {
        if ((newVal.length === 0 && oldVal.length === 0) || newVal === oldVal)
          return;
        $scope.settingsTreeData = newVal;
        $scope.$broadcast("treesettingsready");
      });

      $scope.$watch("selected", function (newValue, oldValue) {
        if (
          typeof newValue === "undefined" ||
          newValue === null ||
          newValue === oldValue
        )
          return;
        selectedNodeLabel = newValue.text;
        $scope.statusView = true;
        getStatusData(selectedNodeLabel);
      });

      $scope.$watch("deselected", function (newValue, oldValue) {
        if (
          typeof newValue === "undefined" ||
          newValue === null ||
          newValue === oldValue
        )
          return;
        $scope.configActive = false;
      });

      $scope.statusObj = {
        productName: null,
        tracwaterSerialNumber: null,
        timestampMostRecentUpload: null,
        timestampMostRecentSample: null,
        timestampNextFlowTime: null,
        timestampNextFlowUploadTime: null,
        locationStreet: null,
        locationCity: null,
        locationState: null,
        locationPostcode: null,
        locationLatitude: null,
        locationLongitude: null,
      };

      $scope.statusView = true;
      $scope.changeView = function (string) {
        if (string === "status") {
          $scope.statusView = true;
        } else {
          $scope.statusView = false;
        }
      };
      getSaveedUserConfiguration();

      $scope.navigationArray = [
        {
          name: "Settings",
          link: "settings",
        },
      ];

      $scope.saveUserConfiguations = function ($event) {
        $scope.contactName = angular.element($("#contact_name")).val();
        $scope.emailAddress = angular.element($("#email_address")).val();
        $scope.smsNumber = angular.element($("#sms_number")).val();
        $scope.aPortalName = "tracnet trial 20230703";
        $scope.aCustomerName = "Gold Coast Water";
        var loginData = {
          contactName: $scope.contactName,
          emailAddress: $scope.emailAddress,
          smsNumber: $scope.smsNumber,
        };
        const query = $http
          .post(
            "https://dev-api-sg.tracwater.asia/api/v1/addSetting?portal=" +
              $scope.aPortalName,
            loginData
          )
          .then(function (response) {
            const data = response.data;
            if (data.status) {
              alert(data.message);
            }
          });
      };

      $scope.configRecord = [];
      $scope.contactName = [];
      $scope.emailAddress = [];
      $scope.smsNumber = [];
      function getSaveedUserConfiguration() {
        $scope.portal = "tracnet trial 20230703";
        const query = $http
          .get(
            "https://dev-api-sg.tracwater.asia/api/v1/get-setting-data?portalName=" +
              $scope.portal
          )
          .then(function (response) {
            const data = response.data.data;
            $scope.contactName = data.contactName;
            $scope.emailAddress = data.emailAddress;
            $scope.smsNumber = data.smsNumber;
            $scope.configRecord = data;
          });
      }

      $scope.configActive = false;
      function getStatusData(selectedLabel) {
        const query = `html_status_getAll_01_a(  read( aTreeNode and textLabel == "${selectedLabel}" and 
                aTreeRef->aPortalRef->id_name == "metrohomessa 20230628" and aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" )->id,now())`;
        Data.sendRequest(query, $rootScope.storage.skysparkVersion).then(
          function (response) {
            if (response.hasOwnProperty("data")) {
              const data = response.data.rows;
              if (data.length > 0) {
                const dict = data[0];
                $scope.statusObj.productName = dict.productName;
                $scope.statusObj.tsEnd = dict.timestamp_end;
                selectedProduct = dict.tracwater_serialNumber;
                $scope.statusObj.tracwaterSerialNumber =
                  dict.tracwater_serialNumber;
                $scope.statusObj.timestampMostRecentUpload =
                  dict.timestamp_mostRecentUpload;
                $scope.statusObj.timestampMostRecentSample =
                  dict.timestamp_mostRecentSample;
                $scope.statusObj.timestampNextFlowTime =
                  dict.timestamp_next_flowTime;
                $scope.statusObj.timestampNextFlowUploadTime =
                  dict.timestamp_next_uploadTime;
                $scope.statusObj.locationStreet = dict.location_street;
                $scope.statusObj.locationCity = dict.location_city;
                $scope.statusObj.locationState = dict.location_state;
                $scope.statusObj.locationPostcode = dict.location_postcode;
                $scope.statusObj.locationLatitude = dict.location_latitude;
                $scope.statusObj.locationLongitude = dict.location_longitude;
                if (
                  $scope.statusObj.tsEnd === "" ||
                  $scope.statusObj.tsEnd === "undefined" ||
                  $scope.statusObj.tsEnd === null ||
                  $scope.statusObj.tsEnd === undefined
                ) {
                  $scope.configActive = true;
                  const query = `html_form_load_dataSettings_01_a("${selectedProduct}",null)`;
                  loadConfigSetting(query);
                } else {
                  $scope.configActive = false;
                }
              } else {
                console.log("no data or function error");
              }
            } else {
              console.log("no data or function error");
            }
          },
          function (err) {
            console.log(err);
          }
        );
      }

      $scope.configSettings = {
        imageRateOptions: [
          { value: 5, name: "5 minutes", seconds: "300s" },
          { value: 10, name: "10 minutes", seconds: "600s" },
          { value: 15, name: "15 minutes", seconds: "900s" },
          { value: 30, name: "30 minutes", seconds: "1800s" },
          { value: 60, name: "1 hour", seconds: "3600s" },
        ],
        imageRate: null,
        samplingRateOptions: [
          { value: 5, name: "5 minutes", seconds: "300s" },
          { value: 10, name: "10 minutes", seconds: "600s" },
          { value: 15, name: "15 minutes", seconds: "900s" },
          { value: 30, name: "30 minutes", seconds: "1800s" },
          { value: 60, name: "1 hour", seconds: "3600s" },
        ],
        samplineRate: null,
        uploadRateOptions: [
          { value: 5, name: "5 minutes", seconds: "300s" },
          { value: 10, name: "10 minutes", seconds: "600s" },
          { value: 15, name: "15 minutes", seconds: "900s" },
          { value: 30, name: "30 minutes", seconds: "1800s" },
          { value: 60, name: "1 hour", seconds: "3600s" },
          { value: 120, name: "2 hours", seconds: "7200s" },
          { value: 240, name: "4 hours", seconds: "14400s" },
        ],
        uploadRate: null,
      };
      function loadConfigSetting(query) {
        Data.sendRequest(query, $rootScope.storage.skysparkVersion).then(
          function (response) {
            const settings = response?.data?.rows?.[0];
            if (settings !== "undefined" && settings !== undefined) {
              const indexImage = getIndex(
                $scope.configSettings.imageRateOptions,
                settings.imageRate_val,
                "value"
              );
              $scope.configSettings.imageRate =
                $scope.configSettings.imageRateOptions[indexImage];
              const indexSampling = getIndex(
                $scope.configSettings.samplingRateOptions,
                settings.samplingRate_val,
                "value"
              );
              $scope.configSettings.samplineRate =
                $scope.configSettings.samplingRateOptions[indexSampling];
              const indexUpload = getIndex(
                $scope.configSettings.uploadRateOptions,
                settings.uploadRate_val,
                "value"
              );
              $scope.configSettings.uploadRate =
                $scope.configSettings.uploadRateOptions[indexUpload];
              $scope.formConfig.$setPristine();
            }
          }
        );
      }

      function getIndex(array, input, key) {
        return array.findIndex((element) => {
          return element[key] === input;
        });
      }

      $scope.saveConfigSettings = function () {
        $scope.message = "Loading...";
        $scope.loading = true;
        let configDict =
          "{samplingRate_val:" +
          $scope.configSettings.samplineRate.seconds +
          ",";
        configDict +=
          "uploadRate_val:" + $scope.configSettings.uploadRate.seconds + ",";
        configDict +=
          "imageRate_val:" + $scope.configSettings.imageRate.seconds + ",";
        if (configDict[configDict.length - 1] === ",") {
          configDict = configDict.substring(0, configDict.length - 1);
        }
        configDict += "}";
        var loginData = {
          contactName: $scope.contactName,
          emailAddress: $scope.emailAddress,
          smsNumber: $scope.smsNumber,
        };

        const query = $http
          .post(
            "https://dev-api-sg.tracwater.asia/api/v1/addSetting",
            loginData
          )
          .then(function (response) {
            const settings = response?.data?.data?.[0];
            if (settings !== "undefined" && settings !== undefined) {
              if (settings?.val !== undefined) {
                if (settings.val === "save successful.") {
                  $scope.loading = false;
                  $scope.message = "Settings successfully changed.";
                  $scope.operationResult = true;
                  $timeout(function () {
                    $scope.operationResult = false;
                  }, 2_500);
                  $scope.reloadConfigData();
                }
              } else {
                $scope.loading = false;
                $scope.message =
                  "Error: Action incomplete. Please notify an OzGreenEnergy employee.";
                $scope.operationResult = true;
                $timeout(function () {
                  $scope.operationResult = false;
                }, 2_500);
              }
            }
          });
        let blueSirenQuery =
          "https://bluesiren.com.au/parser/modify-device-configuration?serialNumber=" +
          selectedProduct +
          "&deviceCommand=";

        if ($scope.formConfig.sampleSelect.$dirty) {
          blueSirenQuery +=
            "CHG_t1_t" +
            parseInt($scope.configSettings.samplineRate.seconds) / 60 +
            "_n";
        }
        if ($scope.formConfig.uploadSelect.$dirty) {
          blueSirenQuery +=
            "CHG_t4_t" +
            parseInt($scope.configSettings.uploadRate.seconds) / 60 +
            "_n";
        }
        if ($scope.formConfig.imageSelect.$dirty) {
          blueSirenQuery +=
            "CHG_t14_t" +
            parseInt($scope.configSettings.imageRate.seconds) / 60 +
            "_n";
        }
        if (blueSirenQuery.endsWith("_n")) {
          blueSirenQuery = blueSirenQuery.substring(
            0,
            blueSirenQuery.length - 2
          );
        }
        $http
          .get(blueSirenQuery)
          .then(function () {})
          .catch(function (err) {
            console.log(err);
          });
      };

      $scope.reloadConfigData = function () {
        loadConfigSetting(
          `html_form_load_dataSettings_01_a("${selectedProduct}",null)`
        );
      };

      let initialData;
      let defaultSettings;

      $scope.changeScheduleType = "all";
      $scope.singleDayString = null;
      $scope.changeFlowSingle = function (singleDay) {
        $scope.singleDayString = singleDay.long.toLowerCase();
        let durIndex = $scope.durationOptions.findIndex(
          (duration) => duration.name === singleDay.flowDuration
        );
        singleDay["selectedDuration"] =
          durIndex !== -1
            ? $scope.durationOptions[durIndex]
            : $scope.durationOptions[0];
        let intIndex = $scope.intervalOptions.findIndex(
          (interval) => interval.name === singleDay.flowInterval
        );
        singleDay["selectedInterval"] =
          intIndex !== -1
            ? $scope.intervalOptions[intIndex]
            : $scope.intervalOptions[1];
        let samIndex = $scope.samplingRateOptions.findIndex(
          (sampling) => sampling.name === singleDay.samplingRate
        );
        singleDay["selectedSamplingRate"] =
          samIndex !== -1
            ? $scope.samplingRateOptions[samIndex]
            : $scope.samplingRateOptions[1];

        $scope.changeScheduleType = "single";
        $scope.pageTwoSettings = singleDay;
        $scope.editFlowVisible = true;
      };

      $scope.changeFlowSelected = function () {
        $scope.changeScheduleType = "all";
        let firstDone = false;
        for (const item in $scope.flowSettings.dailyList) {
          if ($scope.flowSettings.dailyList[item].selected === true) {
            if (!firstDone) {
              let durIndex = $scope.durationOptions.findIndex(
                (duration) =>
                  duration.name ===
                  $scope.flowSettings.dailyList[item].flowDuration
              );
              $scope.flowSettings.dailyList[item]["selectedDuration"] =
                durIndex !== -1
                  ? $scope.durationOptions[durIndex]
                  : $scope.durationOptions[0];
              let intIndex = $scope.intervalOptions.findIndex(
                (interval) =>
                  interval.name ===
                  $scope.flowSettings.dailyList[item].flowInterval
              );
              $scope.flowSettings.dailyList[item]["selectedInterval"] =
                intIndex !== -1
                  ? $scope.intervalOptions[intIndex]
                  : $scope.intervalOptions[1];
              let samIndex = $scope.samplingRateOptions.findIndex(
                (sampling) =>
                  sampling.name ===
                  $scope.flowSettings.dailyList[item].samplingRate
              );
              $scope.flowSettings.dailyList[item]["selectedSamplingRate"] =
                samIndex !== -1
                  ? $scope.samplingRateOptions[samIndex]
                  : $scope.samplingRateOptions[1];
              $scope.pageTwoSettings = $scope.flowSettings.dailyList[item];
              firstDone = true;
            }
          }
        }
        $scope.editFlowVisible = true;
      };

      $scope.changeFlowAll = function () {
        $scope.changeScheduleType = "all";
        let firstDone = false;
        for (const item in $scope.flowSettings.dailyList) {
          $scope.flowSettings.dailyList[item].selected = true;
          if (!firstDone) {
            let durIndex = $scope.durationOptions.findIndex(
              (duration) =>
                duration.name ===
                $scope.flowSettings.dailyList["sunday"].flowDuration
            );
            $scope.flowSettings.dailyList["sunday"]["selectedDuration"] =
              durIndex !== -1
                ? $scope.durationOptions[durIndex]
                : $scope.durationOptions[0];
            let intIndex = $scope.intervalOptions.findIndex(
              (interval) =>
                interval.name ===
                $scope.flowSettings.dailyList["sunday"].flowInterval
            );
            $scope.flowSettings.dailyList["sunday"]["selectedInterval"] =
              intIndex !== -1
                ? $scope.intervalOptions[intIndex]
                : $scope.intervalOptions[1];
            let samIndex = $scope.samplingRateOptions.findIndex(
              (sampling) =>
                sampling.name ===
                $scope.flowSettings.dailyList["sunday"].samplingRate
            );
            $scope.flowSettings.dailyList["sunday"]["selectedSamplingRate"] =
              samIndex !== -1
                ? $scope.samplingRateOptions[samIndex]
                : $scope.samplingRateOptions[1];
            $scope.pageTwoSettings = $scope.flowSettings.dailyList["sunday"];
          }
        }
        $scope.editFlowVisible = true;
      };

      $scope.deselectAll = function () {
        for (const day in $scope.flowSettings.dailyList) {
          $scope.flowSettings.dailyList[day].selected = false;
        }
      };

      $scope.leaveEditFlow = function () {
        $scope.editFlowVisible = false;
      };

      $scope.resetControlledFlow = function () {
        $scope.flowSettings = JSON.parse(JSON.stringify(defaultSettings));
        for (let key in initialData) {
          setDailyItems(key, initialData, "sunday");
          setDailyItems(key, initialData, "monday");
          setDailyItems(key, initialData, "tuesday");
          setDailyItems(key, initialData, "wednesday");
          setDailyItems(key, initialData, "thursday");
          setDailyItems(key, initialData, "friday");
          setDailyItems(key, initialData, "saturday");
        }
        $scope.editFlowVisible = false;
        $scope.controlledFlowFrom.$setPristine();
      };

      $scope.sendTestMessage = function () {
        let userInput = prompt(
          "Please enter your contact no with country code",
          "65"
        );
        if (Number(userInput)) {
          $http
            .get("https://dev-api-sg.tracwater.asia/api/v1/sms?receiverNumber=" + userInput)
            .then(function (res) {
              if (res.status) alert("Test Message Sent!");
            });
        } else {
          alert("Invalid input. Please enter a valid number.");
        }
      };
    }
  )

  .directive("jstreesettings", function () {
    return {
      restrict: "A",
      link: function (scope, element, attrs) {
        scope.$on("treesettingsready", function () {
          $(element)
            .jstree(
              {
                core: {
                  check_callback: true,
                  multiple: false,
                  themes: {
                    name: "default",
                    dots: false,
                    icons: false,
                  },
                  data: scope.settingsTreeData,
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
              $(this).jstree("select_node", ["@29cd0ed2-43b2f4dc"], true);
            })
            .bind("select_node.jstree", function (e, data) {
              scope.selected = data.node;
              scope.deselected = null;
              scope.$apply();
            })
            .bind("deselect_node.jstree", function (e, data) {
              scope.deselected = data.node;
              scope.selected = null;
              scope.$apply();
            });
        });
      },
    };
  });

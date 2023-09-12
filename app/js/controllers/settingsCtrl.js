angular.module('settingsCtrl', [])

  .controller('settingsController', function ($scope, $rootScope, Data, $http, $timeout, $window, $state, $location, apiBaseUrl) {

    const portalRef = 'read( aPortal and aCustomerRef->id_name == "Gold Coast Water" and id_name == "TracNet Master Network" )->id';
    let selectedNodeLabel;
    let selectedProduct;
    $scope.userRecord = [];

    $scope.loading = false;
    $scope.operationResult = false;

    // we are setting the token to pass in header here
    $scope.serverRequest = apiBaseUrl;
    const token = localStorage.getItem("authToken");
    const customeHeader = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };


    $scope.settingsTreeData = $rootScope.storage.treeData;
    if ($scope.settingsTreeData.length > 0) {
      $timeout(function () {
        $scope.$broadcast('treesettingsready');
      }, 100)
    }

    $rootScope.$watch('storage.treeData', function (newVal, oldVal) {
      if ((newVal.length === 0 && oldVal.length === 0) || (newVal === oldVal)) return;
      $scope.settingsTreeData = newVal;
      $scope.$broadcast('treesettingsready');
    });

    $scope.$watch("selected", function (newValue, oldValue) {
      if (typeof newValue === 'undefined' || newValue === null || newValue === oldValue) return;
      selectedNodeLabel = newValue.text;
      $scope.statusView = true;
      getStatusData(selectedNodeLabel);
    });

    $scope.$watch("deselected", function (newValue, oldValue) {
      if (typeof newValue === 'undefined' || newValue === null || newValue === oldValue) return;
      $scope.configActive = false;
    });

    // setting the null values 
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
    }

    $scope.statusView = true;
    $scope.changeView = function (string) {
      if (string === 'status') {
        $scope.statusView = true;
      } else {
        $scope.statusView = false;
      }
    }
    // calling the function here to display 
    getSaveedUserConfiguration();

    $scope.navigationArray = [{
      name: 'Settings',
      link: 'settings'
    }
    ];
    $scope.userData = '';
    $scope.aPortalName = "TracNet Yarra Valley";
    $scope.errorMsgName = null;
    $scope.errorMsgEmail = null;
    $scope.errorMsgNumber = null;
    $scope.alrErrName = false;
    $scope.alrErrEmail = false;
    $scope.alrErrNumber = false;
    $scope.addShow = true;
    $scope.updateShow = false;

    // ADD the record using the form
    $scope.saveUserConfiguationSetting = function () {
      var contactName = $scope.contactName;
      var emailAddress = $scope.emailAddress;
      var smsNumber = $scope.smsNumber;
      var distanceAlert_1 = $scope.distanceAlert_1;
      var distanceAlert_2 = $scope.distanceAlert_2;
      var distanceAlert_3 = $scope.distanceAlert_3;
      var angleAlarm = $scope.angleAlarm;
      var distanceAlarm = $scope.distanceAlarm;

      if (contactName == null || contactName == "") {
        $scope.errorMsgName = "Field is required";
        $scope.alrErrName = true;
        return;
      }

      if (emailAddress == null || emailAddress == "") {
        $scope.errorMsgEmail = "Field is required";
        $scope.alrErrEmail = true;
        return;
      }

      if (smsNumber == null || smsNumber == "") {
        $scope.errorMsgNumber = "Field is required";
        $scope.alrErrNumber = true;
        return;
      }

      if (distanceAlert_1 == null)
        distanceAlert_1 = 0;

      if (distanceAlert_2 == null)
        distanceAlert_2 = 0;

      if (distanceAlert_3 == null)
        distanceAlert_3 = 0;

      if (angleAlarm == null)
        angleAlarm = 0;

      if (distanceAlarm == null)
        distanceAlarm = 0;


      if (smsNumber.startsWith('+')) {
        smsNumber = smsNumber;

      }
      else {
        smsNumber = "+".smsNumber;
        console.log(smsNumber);
      }


      smsNumber = numcheck(smsNumber);
      const query = `{ 
        
        "contactName": "${contactName}" , 
        "emailAddress": "${emailAddress}",
         "smsNumber": "${smsNumber}", 
        "permissions":[{
       
          "Distance_Alert1": "${distanceAlert_1}",
           "Distance_Alert2": "${distanceAlert_2}", 
           "Distance_Alert3": "${distanceAlert_3}" ,
            "Distance_Alarm": "${distanceAlarm}",
             "Angle_Alarm": "${angleAlarm}"
      }]
    }`;



      const query1 = $http
        .post(apiBaseUrl + "alert-alarm-setting/store", query, { headers: customeHeader })
        .then(function (response) {
          const data = response.data;
          console.log(data.status);
          if (data.status) {
            getSaveedUserConfiguration();
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Successfully Added the record',
            });
          } else {
            // Extract and display the error message
            let errorMessage = '';

            if (data.message && data.message.smsNumber && data.message.smsNumber.length > 0) {
              errorMessage = data.message.smsNumber[0];
            } else if (data.message && data.message.emailAddress && data.message.emailAddress.length > 0) {
              errorMessage = data.message.emailAddress[0];
            } else {
              errorMessage = 'An error occurred';
            }

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          }
          // calling the hide function on sucess on error it will not hide
          angular.element($("#form")).css('display', 'none');
        })
        .catch(function (error) {
          if (error.response && error.response.status === 422) {
            // Handle validation errors from the server response
            const validationErrors = error.response.data.errors;
            let errorMessage = '';

            if (validationErrors.emailAddress && validationErrors.emailAddress.length > 0) {
              errorMessage = validationErrors.emailAddress[0];
            } else if (validationErrors.smsNumber && validationErrors.smsNumber.length > 0) {
              errorMessage = validationErrors.smsNumber[0];
            }
            else if (validationErrors.message) {
              errorMessage = validationErrors.message;
            }
            else {
              errorMessage = 'An error occurred';
            }

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          } else {
            let errortext = '';
            if (error.data) {
              if (error.data.message.emailAddress) {
                errortext = error.data.message.emailAddress[0];
              }
              if (error.data.message.smsNumber) {
                errortext = error.data.message.smsNumber[0];
              }
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'An error occurred: ' + errortext,
            });
            console.error("An error occurred:", error);
          }
        });
      // angular.element($("#form")).css('display', 'none');


    }

    $scope.configRecord = [];

    // READ the values from database to display function
    function getSaveedUserConfiguration() {
      $scope.portal = "TracNet Yarra Valley";
      const query2 = $http
        .get(
          apiBaseUrl + "alert-alarm-setting",
          { headers: customeHeader },
        )
        .then(function (response) {
          const data = response.data.data;
          console.log("read", data);
          $scope.contactName = data.contactName;
          $scope.emailAddress = data.emailAddress;
          $scope.smsNumber = data.smsNumber;
          $scope.configRecord = data;

          if (data.length >= 4) {
            // Hide the buttons with the class name "openbtn"
            var buttons = document.getElementsByClassName("openbtn");
            for (var i = 0; i < buttons.length; i++) {
              buttons[i].style.display = "none";
            }
          } else {
            // Show the buttons with the class name "openbtn"
            var buttons = document.getElementsByClassName("openbtn");
            for (var i = 0; i < buttons.length; i++) {
              buttons[i].style.display = "block";
            }
          }
          console.log("$scope.isCreateButtonDisabled:", $scope.isCreateButtonDisabled); // Check the value of the variable
        });


    }

    // Delete the user query
    function deleteUserConfiguations(_id) {
      const config = {
        headers: {
          'Authorization': 'Bearer ' + customeHeader,
          ...customeHeader
        }
      };

      const url = apiBaseUrl + "alert-alarm-setting/delete/" + _id;

      $http.delete(url, config)
        .then(function (response) {
          if (response.data.status) {


            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Configuration deleted successfully.',
            });


            $scope.configRecord = $scope.configRecord.filter(function (item) {
              return item._id !== _id;
            });


          } else {


            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete configuration. Please try again.',
            });
          }
        })
        .catch(function (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while deleting the configuration.',
          });

        });
      getSaveedUserConfiguration();

    }

    // showconfirm popup

    $scope.ShowConfirm = function (email) {
      Swal.fire({
        title: 'Confirm Deletion',
        text: 'Are you sure you want to delete this record?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          deleteUserConfiguations(email);
        } else {
          console.log('You clicked No!');
        }
      });
    };

    $scope.contactName = null;
    $scope.emailAddress = null;
    $scope.smsNumber = null;
    $scope.distanceAlert_1 = null;
    $scope.distanceAlert_2 = null;
    $scope.distanceAlert_3 = null;
    $scope.angleAlarm = null;
    $scope.distanceAlarm = null;

    // editing the user function called on edit button
    $scope.userId = null;
    $scope.editUserConfiguations = function (_id) {
      $scope.reSetValue();
      console.log(_id);
      $scope.userId = _id;
      const config = {
        headers: {
          'Authorization': 'Bearer ' + customeHeader,
          ...customeHeader
        }
      };
      const url = apiBaseUrl + "alert-alarm-setting/edit/" + _id;

      const query3 = $http.get(url, config).then(function (response) {

        if (response.data.status) {
          const data = response.data.data;
          $scope.userRecord = data;
          console.log($scope.userRecord, "$scope.userRecord");
          $scope.contactName = $scope.userRecord.contactName;
          $scope.emailAddress = $scope.userRecord.emailAddress;
          $scope.smsNumber = $scope.userRecord.smsNumber;


          $scope.distanceAlert_1 = $scope.userRecord.alert1 == 0 ? '0' : '1';
          $scope.distanceAlert_2 = $scope.userRecord.alert2 == 0 ? '0' : '1';
          $scope.distanceAlert_3 = $scope.userRecord.alert3 == 0 ? '0' : '1';
          $scope.angleAlarm = $scope.userRecord.angle == 0 ? '0' : '1';
          $scope.distanceAlarm = $scope.userRecord.distance == 0 ? '0' : '1';


          console.log($scope.distanceAlert_1, $scope.distanceAlert_2, $scope.distanceAlert_3, $scope.angleAlarm, $scope.distanceAlarm);

          $scope.updateShow = true;
          $scope.addShow = false;
        }


      });

    }

    // updating the user function called on update button press
    function updateConfigRecord(_id, updatedData) {
      const index = $scope.configRecord.findIndex(item => item._id === _id);
      if (index !== -1) {
        // Update the specific item in the array
        $scope.configRecord[index] = updatedData;
      }
      getSaveedUserConfiguration();
    }

    // update22
    $scope.updateUserConfiguationSetting = function () {
      console.log('inside the update');
      var contactName = $scope.contactName;
      var emailAddress = $scope.emailAddress;
      var smsNumber = $scope.smsNumber;
      var distanceAlert_1 = $scope.distanceAlert_1;
      var distanceAlert_2 = $scope.distanceAlert_2;
      var distanceAlert_3 = $scope.distanceAlert_3;
      var angleAlarm = $scope.angleAlarm;
      var distanceAlarm = $scope.distanceAlarm;

      if (contactName == null || contactName == "") {
        $scope.errorMsgName = "Field is required";
        $scope.alrErrName = true;
        return;
      }

      if (emailAddress == null || emailAddress == "") {
        $scope.errorMsgEmail = "Field is required";
        $scope.alrErrEmail = true;
        return;
      }

      if (smsNumber == null || smsNumber == "") {
        $scope.errorMsgNumber = "Field is required";
        $scope.alrErrNumber = true;
        return;
      }

      if (distanceAlert_1 == null)
        distanceAlert_1 == 0;

      if (distanceAlert_2 == null)
        distanceAlert_2 == 0;

      if (distanceAlert_3 == null)
        distanceAlert_3 == 0;

      if (angleAlarm == null)
        angleAlarm == 0;

      if (distanceAlarm == null)
        distanceAlarm == 0;


      smsNumber = numcheck(smsNumber);

      const query = `{ 
        
        "contactName": "${contactName}" , 
        "emailAddress": "${emailAddress}",
         "smsNumber": "${smsNumber}", 
        "permissions":[{
       
          "Distance_Alert1": "${distanceAlert_1}",
           "Distance_Alert2": "${distanceAlert_2}", 
           "Distance_Alert3": "${distanceAlert_3}" ,
            "Distance_Alarm": "${distanceAlarm}",
             "Angle_Alarm": "${angleAlarm}"
      }]
    }`;


      const config = {
        headers: {
          'Authorization': 'Bearer ' + customeHeader,
          ...customeHeader
        }
      };
      const url = apiBaseUrl + "alert-alarm-setting/update/" + $scope.userId;

      const query3 = $http.put(url, query, config).then(function (response) {
        if (response.data.status) {
          console.log(response.data.status);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Successfully Updated the record',
          });
          updateConfigRecord($scope.userId, response.data.data);
          angular.element($("#form")).css('display', 'none');
        }

      });



    }


    // reset value funtion called before displaying
    $scope.reSetValue = function () {
      $scope.contactName = null;
      $scope.emailAddress = null;
      $scope.smsNumber = null;
      $scope.distanceAlert_1 = null;
      $scope.distanceAlert_2 = null;
      $scope.distanceAlert_3 = null;
      $scope.angleAlarm = null;
      $scope.distanceAlarm = null;
      $scope.updateShow = false;
      $scope.addShow = true;
      $scope.alrErrName = null;
      $scope.alrErrNumber = null;
    }


    // reset function to just reset 3 fields and called on click of reset button
    $scope.reSet3 = function () {
      $scope.reSetValue();
      $scope.contactName = null;
      $scope.emailAddress = null;
      $scope.smsNumber = null;

      $scope.distanceAlert_1 = '0';
      $scope.distanceAlert_2 = '0';
      $scope.distanceAlert_3 = '0';
      $scope.angleAlarm = '0';
      $scope.distanceAlarm = '0';
      $scope.updateShow = false;
    }


    $scope.configActive = false;
    function getStatusData(selectedLabel) {
      const query = `html_status_getAll_01_a(  read( aTreeNode and textLabel == "${selectedLabel}" and 
                aTreeRef->aPortalRef->id_name == "TracNet Master Network" and aTreeRef->aPortalRef->aCustomerRef->id_name == "Gold Coast Water" )->id,now())`;
      Data.sendRequest(query, $rootScope.storage.skysparkVersion).then(function (response) {
        if (response.hasOwnProperty("data")) {
          const data = response.data.rows;
          if (data.length > 0) {
            const dict = data[0];
            $scope.statusObj.productName = dict.productName;
            $scope.statusObj.tsEnd = dict.timestamp_end;
            selectedProduct = dict.tracwater_serialNumber;
            $scope.statusObj.tracwaterSerialNumber = dict.tracwater_serialNumber;
            $scope.statusObj.timestampMostRecentUpload = dict.timestamp_mostRecentUpload;
            $scope.statusObj.timestampMostRecentSample = dict.timestamp_mostRecentSample;
            $scope.statusObj.timestampNextFlowTime = dict.timestamp_next_flowTime;
            $scope.statusObj.timestampNextFlowUploadTime = dict.timestamp_next_uploadTime;
            $scope.statusObj.locationStreet = dict.location_street;
            $scope.statusObj.locationCity = dict.location_city;
            $scope.statusObj.locationState = dict.location_state;
            $scope.statusObj.locationPostcode = dict.location_postcode;
            $scope.statusObj.locationLatitude = dict.location_latitude;
            $scope.statusObj.locationLongitude = dict.location_longitude;
            if ($scope.statusObj.tsEnd === "" || $scope.statusObj.tsEnd === 'undefined' || $scope.statusObj.tsEnd === null || $scope.statusObj.tsEnd === undefined) {
              $scope.configActive = true;
              const query = `html_form_load_dataSettings_01_a("${selectedProduct}",null)`;
              loadConfigSetting(query);
            } else {
              $scope.configActive = false;
            }
          } else {
            console.log('no data or function error');
          }
        } else {
          console.log('no data or function error');
        }
      }, function (err) {
        console.log(err);
      })
    }

    $scope.configSettings = {
      imageRateOptions: [
        { value: 5, name: '5 minutes', seconds: '300s' },
        { value: 10, name: '10 minutes', seconds: '600s' },
        { value: 15, name: '15 minutes', seconds: '900s' },
        { value: 30, name: '30 minutes', seconds: '1800s' },
        { value: 60, name: '1 hour', seconds: '3600s' },
      ],
      imageRate: null,
      samplingRateOptions: [
        { value: 5, name: '5 minutes', seconds: '300s' },
        { value: 10, name: '10 minutes', seconds: '600s' },
        { value: 15, name: '15 minutes', seconds: '900s' },
        { value: 30, name: '30 minutes', seconds: '1800s' },
        { value: 60, name: '1 hour', seconds: '3600s' },
      ],
      samplineRate: null,
      uploadRateOptions: [
        { value: 5, name: '5 minutes', seconds: '300s' },
        { value: 10, name: '10 minutes', seconds: '600s' },
        { value: 15, name: '15 minutes', seconds: '900s' },
        { value: 30, name: '30 minutes', seconds: '1800s' },
        { value: 60, name: '1 hour', seconds: '3600s' },
        { value: 120, name: '2 hours', seconds: '7200s' },
        { value: 240, name: '4 hours', seconds: '14400s' }
      ],
      uploadRate: null,
    }
    function loadConfigSetting(query) {
      Data.sendRequest(query, $rootScope.storage.skysparkVersion).then(function (response) {
        const settings = response?.data?.rows?.[0];
        if (settings !== 'undefined' && settings !== undefined) {
          const indexImage = getIndex($scope.configSettings.imageRateOptions, settings.imageRate_val, "value")
          $scope.configSettings.imageRate = $scope.configSettings.imageRateOptions[indexImage];
          const indexSampling = getIndex($scope.configSettings.samplingRateOptions, settings.samplingRate_val, "value")
          $scope.configSettings.samplineRate = $scope.configSettings.samplingRateOptions[indexSampling];
          const indexUpload = getIndex($scope.configSettings.uploadRateOptions, settings.uploadRate_val, "value")
          $scope.configSettings.uploadRate = $scope.configSettings.uploadRateOptions[indexUpload];
          $scope.formConfig.$setPristine();
        }
      })
    }

    function getIndex(array, input, key) {
      return array.findIndex(element => {
        return element[key] === input;
      })
    }

    $scope.saveConfigSettings = function () {
      $scope.message = 'Loading...'
      $scope.loading = true;
      let configDict = '{samplingRate_val:' + $scope.configSettings.samplineRate.seconds + ','
      configDict += 'uploadRate_val:' + $scope.configSettings.uploadRate.seconds + ','
      configDict += 'imageRate_val:' + $scope.configSettings.imageRate.seconds + ','
      if (configDict[configDict.length - 1] === ',') {
        configDict = configDict.substring(0, configDict.length - 1);
      }
      configDict += '}';
      const query = `html_form_save_dataSettings_01_a(${portalRef},"${selectedProduct}",null,${configDict})`;
      Data.sendRequest(query, $rootScope.storage.skysparkVersion).then(function (response) {
        const settings = response?.data?.rows?.[0];
        if (settings !== 'undefined' && settings !== undefined) {
          if (settings?.val !== undefined) {
            if (settings.val === 'save successful.') {
              $scope.loading = false;
              $scope.message = 'Settings successfully changed.';
              $scope.operationResult = true;
              $timeout(function () {
                $scope.operationResult = false;
              }, 2_500)
              $scope.reloadConfigData();
            }
          } else {
            $scope.loading = false;
            $scope.message = 'Error: Action incomplete. Please notify an OzGreenEnergy employee.';
            $scope.operationResult = true;
            $timeout(function () {
              $scope.operationResult = false;
            }, 2_500)
          }
        }
      })
      let blueSirenQuery = 'https://bluesiren.com.au/parser/modify-device-configuration?serialNumber=' + selectedProduct + '&deviceCommand='

      if ($scope.formConfig.sampleSelect.$dirty) {
        blueSirenQuery += 'CHG_t1_t' + (parseInt($scope.configSettings.samplineRate.seconds) / 60) + '_n'
      }
      if ($scope.formConfig.uploadSelect.$dirty) {
        blueSirenQuery += 'CHG_t4_t' + (parseInt($scope.configSettings.uploadRate.seconds) / 60) + '_n'
      }
      if ($scope.formConfig.imageSelect.$dirty) {
        blueSirenQuery += 'CHG_t14_t' + (parseInt($scope.configSettings.imageRate.seconds) / 60) + '_n'
      }
      if (blueSirenQuery.endsWith("_n")) {
        blueSirenQuery = blueSirenQuery.substring(0, blueSirenQuery.length - 2);
      }
      $http.get(blueSirenQuery)
        .then(function () {
        })
        .catch(function (err) {
          console.log(err)
        });
    }

    $scope.reloadConfigData = function () {
      loadConfigSetting(`html_form_load_dataSettings_01_a("${selectedProduct}",null)`);
    }

    let initialData;
    let defaultSettings;

    $scope.changeScheduleType = 'all';
    $scope.singleDayString = null;
    $scope.changeFlowSingle = function (singleDay) {
      $scope.singleDayString = singleDay.long.toLowerCase();
      let durIndex = $scope.durationOptions.findIndex(duration => duration.name === singleDay.flowDuration);
      singleDay['selectedDuration'] = durIndex !== -1 ? $scope.durationOptions[durIndex] : $scope.durationOptions[0]
      let intIndex = $scope.intervalOptions.findIndex(interval => interval.name === singleDay.flowInterval);
      singleDay['selectedInterval'] = intIndex !== -1 ? $scope.intervalOptions[intIndex] : $scope.intervalOptions[1];
      let samIndex = $scope.samplingRateOptions.findIndex(sampling => sampling.name === singleDay.samplingRate);
      singleDay['selectedSamplingRate'] = samIndex !== -1 ? $scope.samplingRateOptions[samIndex] : $scope.samplingRateOptions[1];

      $scope.changeScheduleType = 'single';
      $scope.pageTwoSettings = singleDay;
      $scope.editFlowVisible = true;
    }

    $scope.changeFlowSelected = function () {
      $scope.changeScheduleType = 'all';
      let firstDone = false;
      for (const item in $scope.flowSettings.dailyList) {
        if ($scope.flowSettings.dailyList[item].selected === true) {
          if (!firstDone) {
            let durIndex = $scope.durationOptions.findIndex(duration => duration.name === $scope.flowSettings.dailyList[item].flowDuration);
            $scope.flowSettings.dailyList[item]['selectedDuration'] = durIndex !== -1 ? $scope.durationOptions[durIndex] : $scope.durationOptions[0]
            let intIndex = $scope.intervalOptions.findIndex(interval => interval.name === $scope.flowSettings.dailyList[item].flowInterval);
            $scope.flowSettings.dailyList[item]['selectedInterval'] = intIndex !== -1 ? $scope.intervalOptions[intIndex] : $scope.intervalOptions[1];
            let samIndex = $scope.samplingRateOptions.findIndex(sampling => sampling.name === $scope.flowSettings.dailyList[item].samplingRate);
            $scope.flowSettings.dailyList[item]['selectedSamplingRate'] = samIndex !== -1 ? $scope.samplingRateOptions[samIndex] : $scope.samplingRateOptions[1];
            $scope.pageTwoSettings = $scope.flowSettings.dailyList[item];
            firstDone = true;
          }
        }
      }
      $scope.editFlowVisible = true;
    }

    $scope.changeFlowAll = function () {
      $scope.changeScheduleType = 'all';
      let firstDone = false;
      for (const item in $scope.flowSettings.dailyList) {
        $scope.flowSettings.dailyList[item].selected = true;
        if (!firstDone) {
          let durIndex = $scope.durationOptions.findIndex(duration => duration.name === $scope.flowSettings.dailyList['sunday'].flowDuration);
          $scope.flowSettings.dailyList['sunday']['selectedDuration'] = durIndex !== -1 ? $scope.durationOptions[durIndex] : $scope.durationOptions[0]
          let intIndex = $scope.intervalOptions.findIndex(interval => interval.name === $scope.flowSettings.dailyList['sunday'].flowInterval);
          $scope.flowSettings.dailyList['sunday']['selectedInterval'] = intIndex !== -1 ? $scope.intervalOptions[intIndex] : $scope.intervalOptions[1];
          let samIndex = $scope.samplingRateOptions.findIndex(sampling => sampling.name === $scope.flowSettings.dailyList['sunday'].samplingRate);
          $scope.flowSettings.dailyList['sunday']['selectedSamplingRate'] = samIndex !== -1 ? $scope.samplingRateOptions[samIndex] : $scope.samplingRateOptions[1];
          $scope.pageTwoSettings = $scope.flowSettings.dailyList['sunday'];
        }
      }
      $scope.editFlowVisible = true;
    }

    $scope.deselectAll = function () {
      for (const day in $scope.flowSettings.dailyList) {
        $scope.flowSettings.dailyList[day].selected = false;
      }
    }

    $scope.leaveEditFlow = function () {
      $scope.editFlowVisible = false;
    }

    $scope.resetControlledFlow = function () {
      $scope.flowSettings = JSON.parse(JSON.stringify(defaultSettings));
      for (let key in initialData) {
        setDailyItems(key, initialData, 'sunday');
        setDailyItems(key, initialData, 'monday');
        setDailyItems(key, initialData, 'tuesday');
        setDailyItems(key, initialData, 'wednesday');
        setDailyItems(key, initialData, 'thursday');
        setDailyItems(key, initialData, 'friday');
        setDailyItems(key, initialData, 'saturday');
      }
      $scope.editFlowVisible = false;
      $scope.controlledFlowFrom.$setPristine();
    }


    function numcheck(number) {
      let mobile_no = number;
      const firstChar = number.substring(0, 1); // Gets the substring from index 0 to 1 (excluding 1)
      if (firstChar != "+") {
        mobile_no = '+' + mobile_no;
      }
      console.log("numn--", mobile_no);
      return mobile_no;

    }
    // sending text message function called on test button click
    $scope.sendTestMessage = function () {
      var userInput = numcheck($scope.smsNumber);
      if (Number(userInput)) {
        userInput = userInput;
        let formData = { "smsNumber": userInput };
        $http.post(apiBaseUrl + "sent-test-sms", formData, { headers: customeHeader }).then(function (response) {
          console.log(response, "response");
          if (response.data.status)
            alert("Test Message Sent!")
        });
      } else {
        alert("Invalid input. Please enter a valid number.");
      }
    }

  })



  .directive('jstreesettings', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        scope.$on("treesettingsready", function () {
          $(element).jstree({
            "core": {
              'check_callback': true,
              "multiple": false,
              "themes": {
                "name": "default",
                "dots": false,
                "icons": false
              },
              "data": scope.settingsTreeData
            },
            "checkbox": {
              "three_state": true
            },
            "plugins": ["search", "checkbox"]
          }, false)
            .bind("loaded.jstree", function (event, data) {
              $(this).jstree("open_all");
              $(this).jstree("select_node", ['@29cd0ed2-43b2f4dc'], true);
            })
            .bind('select_node.jstree', function (e, data) {
              scope.selected = data.node;
              scope.deselected = null;
              scope.$apply();
            })
            .bind('deselect_node.jstree', function (e, data) {
              scope.deselected = data.node;
              scope.selected = null;
              scope.$apply();
            })
        });
      }
    };
  })

angular.module('settingsCtrl', [])

  .controller('settingsController', function ($scope, $rootScope, Data, $http, $timeout, $window, $state, $location, apiBaseUrl, portalId) {
    localStorage.setItem("trackNet", '');
    const token = localStorage.getItem("authToken");
    const customeHeader = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      //'Cache-Control': 'no-cache, no-store, must-revalidate',
    };
    if (localStorage.getItem("authToken") == '' || localStorage.getItem("authToken") == undefined) {
      $state.go('login');
      return;
    }

    $scope.userRecord = [];
    $scope.USerEmail = null;
    $scope.loading = false;
    $scope.operationResult = false;

    // Function to reset the form
    $scope.reSet3 = function (type) {
      if (type == 'add') {
        $scope.contactName = null;
        $scope.emailAddress = null;
        $scope.smsNumber = null;
        $scope.distanceAlert_1 = "0";
        $scope.distanceAlert_2 = "0";
        $scope.distanceAlert_3 = "0";
        $scope.angleAlarm = "0";
        $scope.distanceAlarm = "0";
      }

    };
    $scope.checkValid = function (type) {
      if (type == 'alrErrName' || $scope.contactName) {
        $scope.errorMsgName = "";
        $scope.alrErrName = false;
      }
      if (type == 'alrErrEmail' || $scope.emailAddress) {
        $scope.errorMsgEmail = "";
        $scope.alrErrEmail = false;
      }
      if (type == 'alrErrNumber' || $scope.smsNumber) {
        $scope.errorMsgNumber = "";
        $scope.alrErrNumber = false;
      }
    }

    getSaveedUserConfiguration();
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
      } else {
        $scope.errorMsgName = "";
        $scope.alrErrName = false;
      }

      if (emailAddress == null || emailAddress == "") {
        $scope.errorMsgEmail = "Field is required";
        $scope.alrErrEmail = true;
        return;
      } else {
        $scope.errorMsgEmail = "";
        $scope.alrErrEmail = false;
      }

      if (smsNumber == null || smsNumber == "") {
        $scope.errorMsgNumber = "Field is required";
        $scope.alrErrNumber = true;
        return;
      } else {
        $scope.errorMsgNumber = "";
        $scope.alrErrNumber = false;

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
      const query1 = $http.post(apiBaseUrl + "alert-alarm-setting/store?portalId=" + portalId, query, { headers: customeHeader }).then(function (response) {
        const data = response.data;
        //console.log(data.status);
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
          //console.log(data, "data")
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
      }).catch(function (error) {
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
        }
        else if (error.status == 405) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.data.message,
          });
        }
        else {
          let errortext = '';
          if (error.data) {
            errortext = error.data.message;
          }
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred: ' + errortext,
          });
          //console.error("An error occurred:", errortext);
        }
      });
    }

    $scope.configRecord = [];
    function getSaveedUserConfiguration() {
      const query = $http.get(apiBaseUrl + "alert-alarm-setting?portalId=" + portalId, { headers: customeHeader }).then(function (response) {
        const data = response.data.data;
        $scope.configRecord = data;
        if ($scope.configRecord.length == 4) {
          $scope.disableCreateButton = false;
        } else {
          $scope.disableCreateButton = true;
        }
      });
    }

    function deleteUserConfiguations(_id) {
      const query = $http.delete(apiBaseUrl + "alert-alarm-setting/delete/" + _id, { headers: customeHeader }).then(function (response) {
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
        getSaveedUserConfiguration();
      }).catch(function (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while deleting the configuration.',
        });
      });
    }

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
      //console.log(_id);
      $scope.userId = _id;
      const query3 = $http.get(apiBaseUrl + "alert-alarm-setting/edit/" + _id, { headers: customeHeader }).then(function (response) {

        if (response.data.status) {
          const data = response.data.data;
          $scope.userRecord = data;
          $scope.contactName = $scope.userRecord.contactName;
          $scope.emailAddress = $scope.userRecord.emailAddress;
          $scope.smsNumber = $scope.userRecord.smsNumber;

          $scope.distanceAlert_1 = $scope.userRecord.alert1 == 0 ? '0' : '1';
          $scope.distanceAlert_2 = $scope.userRecord.alert2 == 0 ? '0' : '1';
          $scope.distanceAlert_3 = $scope.userRecord.alert3 == 0 ? '0' : '1';
          $scope.angleAlarm = $scope.userRecord.angle == 0 ? '0' : '1';
          $scope.distanceAlarm = $scope.userRecord.distance == 0 ? '0' : '1';

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

    $scope.updateUserConfiguationSetting = function () {
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
      } else {
        $scope.errorMsgName = "";
        $scope.alrErrName = false;
      }

      if (emailAddress == null || emailAddress == "") {
        $scope.errorMsgEmail = "Field is required";
        $scope.alrErrEmail = true;
        return;
      } else {
        $scope.errorMsgEmail = "";
        $scope.alrErrEmail = false;
      }

      if (smsNumber == null || smsNumber == "") {
        $scope.errorMsgNumber = "Field is required";
        $scope.alrErrNumber = true;
        return;
      } else {
        $scope.errorMsgNumber = "";
        $scope.alrErrNumber = false;

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
                "contactName": "${contactName}",
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
      const query3 = $http.put(apiBaseUrl + "alert-alarm-setting/update/" + $scope.userId, query, { headers: customeHeader }).then(function (response) {
        if (response.data.status) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Successfully Updated the record',
          });
          updateConfigRecord($scope.userId, response.data.data);
          angular.element($("#form")).css('display', 'none');
        }
      }).catch(function (error) {
        if (error.status == 405) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.data.message,
          });
        }
      });
    }

    $scope.reSetValue = function () {

      $scope.smsNumber = null;
      $scope.emailAddress = null;
      $scope.mobileNumber = null;
      $scope.contactName = null;
      $scope.distanceAlert_1 = null;
      $scope.distanceAlert_2 = null;
      $scope.distanceAlert_3 = null;
      $scope.angleAlarm = null;
      $scope.distanceAlarm = null;
      $scope.updateShow = false;
      $scope.addShow = true;
      $scope.alrErrName = false;
      $scope.alrErrEmail = false;
      $scope.alrErrNumber = false;


    }

    $scope.clearForm = function () {
      $scope.smsNumber = null;
      $scope.emailAddress = null;
      $scope.mobileNumber = null;
      $scope.contactName = null;
    }

    function numcheck(number) {
      let mobile_no = number;
      const firstChar = number.substring(0, 1); // Gets the substring from index 0 to 1 (excluding 1)
      if (firstChar != "+") {
        mobile_no = '+' + mobile_no;
      }
      return mobile_no;

    }

    // sending text message function called on test button click
    $scope.sendTestMessage = function () {
      var userInput = numcheck($scope.smsNumber);
      if (Number(userInput)) {
        userInput = userInput;
        let formData = { "smsNumber": userInput };
        $http.post(apiBaseUrl + "sent-test-sms", formData, { headers: customeHeader }).then(function (response) {
          //console.log(response, "response");
          if (response.data.status)
            alert("Test Message Sent!")
        });
      } else {
        alert("Invalid input. Please enter a valid number.");
      }
    }

  })
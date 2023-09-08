angular
  .module("homeCtrl", [])

  .controller(
    "homeController",
    function ($scope, $http, $rootScope, Data, $timeout, $compile, $interval, apiBaseUrl, $window) {

      $scope.pointSettingData = '';
      $scope.emptyVal = 3998;
      $scope.fullVal = 400;
      $scope.showAlert1 = true;
      $scope.showAlert2 = true;
      $scope.showAlert3 = true;
      $scope.addAlertModel = false;
      $scope.alertError = false;
      $scope.disableBtn = false;
      $scope.deleteBtn = false;
      $scope.enableBtn = false;
      $scope.alert1Check = 0;
      $scope.alert2Check = 0;
      $scope.alert3Check = 0;
      $scope.addClass = '';
      $scope.btnValue = '';
      $scope.deleteModel = false;
      $scope.Alt1 = false;
      $scope.Alt2 = false;
      $scope.Alt3 = false;
      $scope.activeBtn = false;
      $scope.values = [];
      $scope.disableAlertArray = [{
        'alt1': false,
        'alt2': false,
        'alt3': false
      }];
      $scope.deleteAlertArray = [{
        'al1': false,
        'al2': false,
        'al3': false
      }];

      $scope.refreshPage = function () {
        setTimeout(function () {
          window.location.reload();
        }, 50);
      };

      $scope.serverRequest = apiBaseUrl;
      const token = localStorage.getItem("authToken");
      const customeHeader = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };


      let styles = [
        {
          featureType: "administrative.locality",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "administrative.locality",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "administrative.neighborhood",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "administrative.land_parcel",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "administrative.land_parcel",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.attraction",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.business",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.government",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.medical",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "poi.park",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.place_of_worship",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.school",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "poi.sports_complex",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "road.arterial",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "road.local",
          elementType: "labels.text",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
      ];
      const initZoomLevel = 11;
      const myLatLng = new google.maps.LatLng(-28.033546, 153.381246);
      const mapOptions = {
        // center: myLatLng,
        // mapTypeId: google.maps.MapTypeId.SATELLITE,
        // fullscreenControl: false,
        // disableDefaultUI: true,
        center: new google.maps.LatLng(-28.033546, 153.381246), //IS-384
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        fullscreenControl: false,
        styles: styles,
      };

      const map = new google.maps.Map(
        document.getElementById("homeMap"),
        mapOptions
      );

      $scope.displayData = [];
      $scope.sortedArray = [];
      $scope.isLoading = false;

      addMarker();
      var arr = [];
      var last_comm_split = null;

      function closest(array, num) {
        var i = 0;
        var minDiff = 1000;
        var ans;
        for (i in array) {
          var m = Math.abs(num - array[i]);
          if (m < minDiff) {
            minDiff = m;
            ans = array[i];
          }
        }
        return ans;
      }

      function getObjectKey(obj, value) {
        return Object.keys(obj).find(key => obj[key] === value);
      }

      /*showing all markers*/
      var arr = [];
      function addMarker() {
        $scope.isLoading = true;
        const query = $http.get(apiBaseUrl + "newtraknetApiList", { headers: customeHeader }).then(function (res) {
          const response = res.data.data;
          const response_pointDis = res.data.pointDis;


          var convertedData = [];

          for (var i = response.length - 1; i > 0; i--) {
            var data = response[i];
            var objectId = data._id.$oid;

            var existingObject = convertedData.find(
              (obj) => obj.locationID === objectId
            );

            if (!existingObject) {


              if (data.point.angle > 5) {
                var angleColorRank = 1;
                var angleColor = "Red";
                var angle_alarm_tr = "Angle alarm Triggered";
              } else {
                var angleColorRank = 3;
                var angleColor = "Green";
                var angle_alarm_tr = "";
              }

              var distanceValue = parseInt(data.point.height);
              var dis_color_rank = 3;
              var dis_color = "Green";
              var distance_alarm_tr = " - ";

              if (data.point.height > 3998) {
                var dis_color_rank = 3;
                var dis_color = "";
                var distanceValue = "";
              }

              if (data.point.height < data.point.distance_alert) {
                var distance_alarm_tr = "Distance alert Triggered";
                var dis_color_rank = 2;
                var dis_color = "yellow";
              }
              // value of the <= 400 comparator
              if (data.point.height <= 400) {
                var distanceValue = 400;
                var distance_alarm_tr = "Distance alarm Triggered";
                var dis_color_rank = 1;
                var dis_color = "Red";
              }



              if (data.point.manhole_level_alarm == "Not full alarm") {
                var manhole_level_alarm = 0;
              } else {
                var manhole_level_alarm = 1;
              }

              if (data.manhole_level_alarm == "Not moved") {
                var manhole_moved_alarm = 0;
              } else {
                var manhole_moved_alarm = 1;
              }

              if (parseInt(data.point.created_at.$date.$numberLong)) {
                const convertDateStringToISOString = function (dateString) {
                  const dateArray = dateString.split("_");
                  const datePart = dateArray[0].split("-").map(Number);
                  const timePart = dateArray[1].split("-").map(Number);

                  // Note: Months in JavaScript Date are zero-based (0-11)
                  const date = new Date(Date.UTC(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]));
                  return date;
                };

                const inputDateString = data.point.date;
                const ttemp = convertDateStringToISOString(inputDateString);
                const specificDate = moment(ttemp).tz("Asia/Singapore");

                const currentDate = moment().tz("Asia/Singapore");
                var timeDiff = Math.abs(currentDate - specificDate);

                var cd = 24 * 60 * 60 * 1000;
                var hValue = Math.floor(timeDiff / cd);
                if (hValue > 25) {
                  var lastComm = "Communications alarm Triggered";
                  var lastCommColor = 3;
                } else {
                  var lastComm = "";
                  var lastCommColor = "";
                }

                if (timeDiff < 1000) {
                  //miliseconds
                  var hours = timeDiff + " ms";
                } else if (timeDiff >= 1000 && timeDiff < 60000) {
                  //seconds
                  var hours = ((timeDiff % 60000) / 1000).toFixed(0) + "s";
                } else if (timeDiff >= 60000 && timeDiff < 3600000) {
                  //mins
                  var hours =
                    Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)) +
                    "min";
                } else if (timeDiff >= 3600000 && timeDiff < 86400000) {
                  //hours
                  var hours = Math.floor(timeDiff / 3600000) + "h";
                } else if (timeDiff >= 86400000 && timeDiff < 2592000000) {
                  //day
                  var hours = Math.floor(timeDiff / cd) + "d";
                } else if (timeDiff >= 2592000000 && timeDiff < 31536000000) {
                  //week
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60)) + "wk";
                } else {
                  //year
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60)) + "y";
                }

                var timeDate = hours;
                data.ts = hours + " ago";
                var totalSeconds = timeDiff;
                data.totalSeconds = totalSeconds;
              }

              var convertedPoint = {
                locationID: data._id.$oid,
                address:
                  data.location.street +
                  " " +
                  data.location.city +
                  " " +
                  data.location.tz,
                location: data.point._id.$oid,
                latitude: parseFloat(data.location.latitude),
                longitude: parseFloat(data.location.longitude),
                city: data.location.city,
                serialNumber: data.product.id_serial,
                installationId: data.point._id.$oid,
                installationName: data.treenode.textLabel,
                angle: parseInt(data.point.angle),
                angleColorRank: parseInt(angleColorRank),
                angleColor: angleColor,
                angle_alarm_tr: angle_alarm_tr,
                lastCommColorRank: lastCommColor,
                lastComm_alarm_tr: lastComm,
                last_communication: timeDiff,
                manhole_level_alarm: manhole_level_alarm,
                manhole_moved_alarm: manhole_moved_alarm,
                status: "all clear",
                color: "green",
                oldest_comm_date: timeDate,
                customDistance: 500,
                area: data.location.street,
                batteryStatus: data.point.manholeBatteryStatusValue,
                batteryVolt: data.point.battery_voltage,
                distance: distanceValue,
                disColorRank: parseInt(dis_color_rank),
                disColor: dis_color,
                distance_alarm_tr: distance_alarm_tr,
                distanceValue: distanceValue,
                levelAlarm: data.point.manholeLevelAlarmValue,
                movedAlarm: data.point.moved_alarm,
                signalStrength: data.point.signal_strength,
                temperature: data.point.temperature,
                ts: data.ts,
                height: data.point.height,
              };

              convertedData.push(convertedPoint);
            }
          }

          const mergedArray = convertedData.map(item1 => {
            const matchingItem2 = response_pointDis.find(item2 => item2.id_serial === item1.serialNumber);
            if (matchingItem2) {

              var distanceObjectValid = false;
              try {
                JSON.parse(matchingItem2.distance_alert);
                distanceObjectValid = true;
              } catch (e) {
                distanceObjectValid = false;
              }

              if (distanceObjectValid && matchingItem2.distance_alert !== null && matchingItem2.distance_alert !== '') {
                var point_alt = JSON.parse(matchingItem2.distance_alert);
              } else {
                var point_alt = { alarmFirstCheck: 0, alarmSecondCheck: 0, alarmThirdCheck: 0, alert1: 400, alert2: 400, alert3: 400, full: 400, empty: 3998 }
              }
              return {
                ...item1,
                totalAlerts: point_alt,
                aCheck1: point_alt.alarmFirstCheck ?? 0,
                aCheck2: point_alt.alarmSecondCheck ?? 0,
                aCheck3: point_alt.alarmThirdCheck ?? 0,
                alertOne: (point_alt.alert1) ? parseInt(point_alt.alert1) : 400,
                alertTwo: (point_alt.alert2) ? parseInt(point_alt.alert2) : 400,
                alertThree: (point_alt.alert3) ? parseInt(point_alt.alert3) : 400,
                empty: (point_alt.empty) ? parseInt(point_alt.empty) : 3998,
                full: (point_alt.full) ? parseInt(point_alt.full) : 400,
                relative_distance: Math.round(((((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400) - (item1.distance - (point_alt.full) ? parseInt(point_alt.full) : 400)) / ((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400)) * 100),
              };
            }
            return item1;
          });

          const aLocation = mergedArray;
          $scope.dataLocation = aLocation;

          const sorter = (a, b) => {
            return a.last_communication - b.last_communication;
          };

          const sortByLastComm = (arr) => {
            arr.sort(sorter);
          };

          var arrRed__1_1 = [];
          var arrRed__1_2 = [];
          var arrRed__2_1 = [];
          var arrRed__1_3 = [];
          var arrRed__3_1 = [];
          var arrYellow_2_2 = [];
          var arrYellow_2_3 = [];
          var arrYellow_3_3 = [];
          var arrYellow_3_2 = [];

          for (var i = 0; i < $scope.dataLocation.length; i++) {
            if ($scope.dataLocation[i].hasOwnProperty('full')) {
              $scope.fullVal = $scope.dataLocation[i].full;
            }

            if ($scope.dataLocation[i].hasOwnProperty('empty')) {
              $scope.emptyVal = $scope.dataLocation[i].empty;
            }

            $scope.dataLocation[i]['relative_distance'] = Math.round(((($scope.emptyVal - $scope.fullVal) - ($scope.dataLocation[i].distance - $scope.fullVal)) / ($scope.emptyVal - $scope.fullVal)) * 100);

            if ($scope.dataLocation[i]['relative_distance'] < 0) {
              $scope.dataLocation[i]['relative_distance'] = 0;
            }
            if ($scope.dataLocation[i]['relative_distance'] > 100) {
              $scope.dataLocation[i]['relative_distance'] = 100;
            }
            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__1_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 2) {
              arrRed__1_2.push($scope.dataLocation[i]);
            }
            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__2_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 3) {
              arrRed__1_3.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__3_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 2) {
              arrYellow_2_2.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 3) {
              arrYellow_2_3.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 2) {
              arrYellow_3_2.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 3) {
              arrYellow_3_3.push($scope.dataLocation[i]);
            }
          }

          connCatArr_1 = arrRed__1_3.concat(arrRed__3_1);
          connCatArr_2 = arrYellow_2_3.concat(arrYellow_3_2);

          sortByLastComm(arrRed__1_1);
          sortByLastComm(arrRed__1_2);
          sortByLastComm(arrRed__2_1);
          sortByLastComm(connCatArr_1);
          sortByLastComm(connCatArr_2);
          sortByLastComm(arrYellow_3_3);

          $scope.sortedArray = arrRed__1_1.concat(arrRed__1_2);
          $scope.sortedArray = $scope.sortedArray.concat(arrYellow_2_2);

          $scope.sortedArray = $scope.sortedArray.concat(arrRed__2_1);
          $scope.sortedArray = $scope.sortedArray.concat(connCatArr_1);
          $scope.sortedArray = $scope.sortedArray.concat(connCatArr_2);
          $scope.sortedArray = $scope.sortedArray.concat(arrYellow_3_3);

          for (var k = 0; k < $scope.sortedArray.length; k++) {

            last_comm_split = $scope.sortedArray[k].oldest_comm_date.split(" ");

            if (last_comm_split[1] == "minutes" || last_comm_split[1] == "minute") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "min";

            }
            else if (last_comm_split[1] == "hours" || last_comm_split[1] == "hour") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "h";

            }
            else if (last_comm_split[1] == "day" || last_comm_split[1] == "days") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "d";

            }
            else if (last_comm_split[1] == "weeks" || last_comm_split[1] == "week") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "wk";

            }
            else if (last_comm_split[1] == "month" || last_comm_split[1] == "months") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "mo";

            }
            else if (last_comm_split[1] == "second" || last_comm_split[1] == "seconds") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "s";

            }
            else {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0];
            }
          }

          $scope.sortedArray_1 = $scope.sortedArray;
          // sorted end
          for (var i = 0; i < $scope.sortedArray_1.length; i++) {
            arr.push(aLocation[i].installationId.split(" ")[0]);

            let dict = {};
            dict["id"] = aLocation[i].installationId.split(" ")[0];
            dict["latitude"] = aLocation[i].latitude;
            dict["longitude"] = aLocation[i].longitude;
            dict["distance"] = aLocation[i].distance;
            dict['relative_distance'] = aLocation[i].relative_distance;
            dict['distance_main'] = aLocation[i].distance;
            dict["angle"] = aLocation[i].angle;
            dict["db_height"] = aLocation[i].height;
            dict["status"] = aLocation[i].status;
            dict["address"] = aLocation[i].address;
            dict["installationName"] = aLocation[i].installationName;
            dict["city"] = aLocation[i].city;
            dict["infoBox"] = null;
            dict["serial_no"] = aLocation[i].serialNumber;
            dict["colorRank"] = aLocation[i].disColorRank;
            dict["colorRank2"] = aLocation[i].angleColorRank;
            dict['totalAlerts'] = {
              'al1': aLocation[i].alertThree,
              'al2': aLocation[i].alertTwo,
              'al3': aLocation[i].alertOne
            }
            dict['chk1'] = aLocation[i].aCheck1;
            dict['chk2'] = aLocation[i].aCheck2;
            dict['chk3'] = aLocation[i].aCheck3;
            let marker = buildMarker(dict);
            dict["marker"] = marker;
            dict["point"] = marker.point;
            $scope.displayData.push(dict);
          }
        }).catch(function (error) {
          if (error.status == 401) {
            $window.localStorage.removeItem('authToken');
            $rootScope.storage.loggedIn = false;
            $rootScope.storage.authToken = false;
            $rootScope.storage.$reset();
            $scope.refreshPage();
            $state.go('login');
          }
        })
          .finally(function () {
            $scope.isLoading = false;
          });
      }

      let beachMarker = [];
      // $scope.altArr = [];
      function buildMarker(dict) {


        if (typeof dict.latitude === "undefined" && typeof dict.longitude === "undefined")
          return;

        if (dict.relative_distance < 0) {
          dict.relative_distance = 0;
        }
        if (dict.relative_distance > 100) {
          dict.relative_distance = 100;
        }

        let altArr = [];
        if (dict.chk1 == 1) {
          if (dict.distance <= dict.totalAlerts.al1) {
            altArr.push(dict.totalAlerts.al1);
          }
        }
        if (dict.chk2 == 1) {
          if (dict.distance <= dict.totalAlerts.al2) {
            altArr.push(dict.totalAlerts.al2);
          }
        }
        if (dict.chk3 == 1) {
          if (dict.distance <= dict.totalAlerts.al3) {
            altArr.push(dict.totalAlerts.al3);
          }
        }
        var infowindow = new google.maps.InfoWindow({
          content: dict.relative_distance.toLocaleString() + "%" + ",  " + dict.angle + "\xBA",
        });

        var colorCode = dict.colorRank;
        var colorCode2 = dict.colorRank2;
        // console.log(colorCode,colorCode2,"dist11212");
        var imgpath = "";

        if (colorCode) {
          if (colorCode == 3 && colorCode2 == 3) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 3) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 2) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 2) {
            if (altArr.length <= 1) {
              var result = getObjectKey(dict.totalAlerts, altArr[0]);
            } else {
              let value = closest(altArr, dict.distance_main)
              var result = getObjectKey(dict.totalAlerts, value);
            }
            // var value = closest(altArr, dict.distance_main);
            // var result = getObjectKey(dict.totalAlerts, value);
            if (dict.distance == '') {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }

            // if (dict.height < 400) {
            //   var imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
            // }

            if (altArr.length == 0) {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }

            if (result == 'al1') {
              imgpath = './img/triangle.svg';
            }

            if (result == 'al2') {
              imgpath = './img/square.svg';
            }

            if (result == 'al3') {
              imgpath = './img/circle.svg';
            }
          }
          if (colorCode == 2 && colorCode2 == 3) {
            if (altArr.length <= 1) {
              var result = getObjectKey(dict.totalAlerts, altArr[0]);
            } else {
              let value = closest(altArr, dict.distance_main)
              var result = getObjectKey(dict.totalAlerts, value);
            }


            if (altArr.length == 0) {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }

            if (result == 'al1') {
              imgpath = './img/triangle.svg';
            }

            if (result == 'al2') {

              imgpath = './img/square.svg';
            }

            if (result == 'al3') {
              imgpath = './img/circle.svg';
            }
            if (parseInt(dict.db_height) < 400) {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
            }
          }
          if (colorCode == 3 && colorCode2 == 2) {

            var imgpath = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

          }
        }

        let point = { lat: dict.latitude, lng: dict.longitude };
        let iconPath = imgpath;
        let iconTemp = {
          url: iconPath,
          size: new google.maps.Size(40, 40),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        };
        beachMarker[dict.id] = new google.maps.Marker({
          position: point,
          map: map,
          icon: iconTemp,
          title: dict.longName,
          id: dict.id,
        });
        beachMarker[dict.id].addListener("click", function () {
          infowindow.open(map, beachMarker[dict.id]);
        });
        infowindow.open(map, beachMarker[dict.id]);
        beachMarker[dict.id].addListener("click", function () {
          const node = dict;
          if (node === null) return;
          getInfoWinData(node, this);
        });

        reCenterMap(point);

        return {
          id: dict.id,
          point: point,
          marker: beachMarker[dict.id],
        };
      }

      function reCenterMap(point) {
        const bounds = new google.maps.LatLngBounds();
        let oldBoundCount = 0;
        const totalBoundCount = $scope.displayData.length;
        for (let i = 0; i < totalBoundCount; i++) {
          if ($scope.displayData[i].point != null) {
            bounds.extend($scope.displayData[i].point);
            oldBoundCount++;
          }
        }
        if (point != null) bounds.extend(point);
        else if (oldBoundCount == 0) bounds.extend(myLatLng);

        map.fitBounds(bounds);
        map.setCenter(bounds.getCenter());
        if (point == null && oldBoundCount == 0 && totalBoundCount != 0)
          map.setZoom(initZoomLevel);
      }

      function clearInfoBox(id) {
        const index = getIndex($scope.displayData, "id");
        if ($scope.displayData[index] === undefined) return;
        if ($scope.displayData[index].infoBox === null) return;
        if (
          $scope.displayData[index].infoBox !== null ||
          $scope.displayData[index].infoBox !== "undefined"
        ) {
          $scope.displayData[index].infoBox.close();
        }
      }

      $scope.markers = '';
      $scope.nodes = '';

      function getInfoWinData(node, marker) {
        $scope.markers = marker;
        $scope.nodes = node;

        let homeiw;
        let boxText = document.createElement("div");
        boxText.style.cssText =
          "text-align: center; background: black; color: white; padding: 2px;";
        let nodeID = node.id ?? node.installationId.split(" ")[0];
        boxText.setAttribute("id", "infoBox_" + nodeID.split(" ")[0]);
        let tempInnerHTML = "<b>Loading...</b>";
        boxText.innerHTML = tempInnerHTML;
        let myOptions = {
          content: boxText,
          disableAutoPan: true,
          maxWidth: 0,
          zIndex: 999,
          boxStyle: {
            opacity: 1,
            width: "300px",
          },
          closeBoxMargin: "5px 5px 5px 5px",
          closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
          infoBoxClearance: new google.maps.Size(1, 1),
          isHidden: false,
          pane: "floatPane",
          dataId: "aaaa",
          enableEventPropagation: false,
        };

        homeiw = new InfoBox(myOptions);
        homeiw.setPosition(marker.position);
        homeiw.open(map);
        const index = getIndex($scope.displayData, "id", nodeID.split(" ")[0]);
        for (let i = 0; i < $scope.displayData.length; i++) {
          if (i !== index) {
            if ($scope.displayData[i].infoBox) {
              clearInfoBox($scope.displayData[i].id);
            }
          }
        }
        map.setCenter(marker.position);
        homeiw.addListener("closeclick", function () {
          reCenterMap(null);
        });

        $scope.displayData[index]["infoBox"] = homeiw;
        $scope.getStoreAlert = '';
        localStorage.setItem("node_id", nodeID.split(" ")[0]);
        const query = $http.get(apiBaseUrl + "html_aTreeNode_hisEndVal?aTreeNodeId=" + nodeID, { headers: customeHeader }).then(function (response) {
          const readings = response.data.data;

          $http.get(apiBaseUrl + `getDeviceIdByPointID/${nodeID}`, { headers: customeHeader }).then(function (res) {
            var getTableAlert = res.data.data.distance_alert;
            $scope.getStoreAlert = res.data.data.distance_alert;

            let content = document.createElement("div");
            content.style.cssText =
              "text-align: center; background: black; color: white; padding: 5px; font-size: 1.8rem";
            content.setAttribute("id", "infoBox_" + nodeID.split(" ")[0]);

            let tempInnerHTML = "<b>" + node.installationName + "</b><table class='homemaptable'>";

            for (let i = 0; i < readings.length; i++) {
              if (readings[i].id_name == "Distance") {
                var sdistance = String(readings[i].hisEndVal);
                sdistance = sdistance.replace(/ mm/g, '');

                if (getTableAlert !== null && 'full' in getTableAlert) {
                  var relativeDistance = Math.round((((parseInt(getTableAlert.empty) - parseInt(getTableAlert.full)) - (parseInt(sdistance) - parseInt(getTableAlert.full))) / (parseInt(getTableAlert.empty) - parseInt(getTableAlert.full))) * 100);
                } else {
                  var relativeDistance = Math.round((((3998 - 400) - (parseInt(sdistance) - 400)) / (3998 - 400)) * 100);
                }
                if (relativeDistance < 0) {
                  relativeDistance = 0;
                }
                if (relativeDistance > 100) {
                  relativeDistance = 100;
                }

                tempInnerHTML = tempInnerHTML + "<tr><td>Relative Distance</td><td>" + res.data.data.distance_percentage + "%</td></tr>";

              }
              if (readings[i].id_name == "Battery Voltage") {
                tempInnerHTML =
                  tempInnerHTML +
                  "<tr><td class='infowindow_td'>" +
                  readings[i].id_name +
                  "</td><td class='infowindow_td'>" +
                  readings[i].hisEndVal +
                  " " +
                  (readings[i].unit ? readings[i].unit : "");
              } else {
                tempInnerHTML =
                  tempInnerHTML +
                  "<tr><td class='infowindow_td'>" +
                  readings[i].id_name +
                  "</td><td class='infowindow_td'>" +
                  readings[i].hisEndVal +
                  " " +
                  (readings[i].unit ? readings[i].unit : "");
              }
            }

            tempInnerHTML =
              tempInnerHTML +
              "<tr><td>TracNet IMEI</td><td>" + res.data.data.device_id + "</td></tr> <tr ><td colspan='2'><i>Last Updated " + res.data.data.date + " ago</i></td></tr> <tr style='background: #ececec;'><td colspan='2'><div ><p  style='height:50px;width:100%;padding: 24px; color: black;margin: 0; cursor: pointer;text-align: left;'> Manhole Specifications </p></div><div style='gap: 10px; margin: -40px 0px 0px 160px;height: 40px;width: 40px;'><img ng-click='poppupForm()' src='./img/icon1-01.svg'/ style='cursor: pointer;'></div>";


            if (res.data.status == true)
              if (getTableAlert) {
                tempInnerHTML = tempInnerHTML + `<tr class="bottom-cl"><td><label for="">Distance at Full (100%)</label></td><td><div class="ng-binding">${(getTableAlert.full) ?? '400'}mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance at Empty (0%)</label></td><td><div class="ng-binding">${(getTableAlert.empty) ?? '3,998'}mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 1</label></td><td><div class="ng-binding">${(getTableAlert.alert1) ?? ''}mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 2</label></td><td><div class="ng-binding">${(getTableAlert.alert2) ?? ''}mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 3</label></td><td><div class="ng-binding">${(getTableAlert.alert3) ?? ''}mm</div></td></tr>`;
              }
              else {
                tempInnerHTML = tempInnerHTML + `<tr class="bottom-cl"><td><label for="">Distance at Full (100%)</label></td><td><div class="ng-binding">400 mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance at Empty (0%)</label></td><td><div class="ng-binding">3,998 mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 1</label></td><td><div class="ng-binding">mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 2</label></td><td><div class="ng-binding">mm</div></td></tr><tr class="bottom-cl"><td><label for="">Distance Alert 3</label></td><td><div class="ng-binding">mm</div></td></tr>`;
              }


            tempInnerHTML = tempInnerHTML + "</table>";

            content.innerHTML = tempInnerHTML;

            var compiled = $compile(content)($scope);
            if (node.installationId) {
              var homeiw = new google.maps.InfoWindow();
              homeiw.setOptions({ content: compiled[0] });
              homeiw.open(map, marker);
            }
            $scope.displayData[index]["infoBox"].setOptions({
              content: compiled[0],
            });
          });
        }).catch(function (error) {
          if (error.status == 401) {
            $window.localStorage.removeItem('authToken');
            $rootScope.storage.loggedIn = false;
            $rootScope.storage.authToken = false;
            $rootScope.storage.$reset();
            $scope.refreshPage();
            $state.go('login');
          }
        });
      }

      /*open the poppup form click on setting icon in info window*/
      $scope.poppupForm = function () {
        $scope.alarmCount = 0;
        var node_id = localStorage.getItem("node_id");
        $("#popupModalCenter").addClass("show-modal");
        $http.get(apiBaseUrl + "user-definded-distancealert?aTreeNodeRef=" + node_id, { headers: customeHeader }).then(function (response) {
          if (response.data.data.distance_alert === undefined || response.data.data.distance_alert == '') {
            $scope.alarmCount = "";
            $scope.alert1 = "";
            $scope.alert2 = "";
            $scope.alert3 = "";
          } else {
            localStorage.setItem("instName", response.data.data.installationName);
            $scope.pointSettingData = JSON.parse(response.data.data.distance_alert);

            $scope.alarmCount = parseInt(($scope.pointSettingData.alert1) ? 1 : 0) + parseInt(($scope.pointSettingData.alert2) ? 1 : 0) + parseInt(($scope.pointSettingData.alert3) ? 1 : 0)
            $scope.emptyVal = parseInt($scope.pointSettingData.empty);
            $scope.fullVal = parseInt($scope.pointSettingData.full);
            $scope.alert1 = parseInt($scope.pointSettingData.alert1);
            $scope.alert2 = parseInt($scope.pointSettingData.alert2);
            $scope.alert3 = parseInt($scope.pointSettingData.alert3);
            $scope.alert1Check = $scope.pointSettingData.alarmFirstCheck;
            $scope.alert2Check = $scope.pointSettingData.alarmSecondCheck;
            $scope.alert3Check = $scope.pointSettingData.alarmThirdCheck;
            $scope.showAlert1 = true;
            $scope.showAlert2 = true;
            $scope.showAlert3 = true;

            /** Setting alert blur as per thier check value starts*/
            if ($scope.pointSettingData.alarmFirstCheck === null) {
              $scope.addAlt1Class = 'alertLight';
              $scope.disAlt1 = '';
              $scope.altStatus1 = 'Disabled';
            } else {
              $scope.addAlt1Class = '';
              $scope.disAlt1 = Math.round(((($scope.emptyVal - $scope.fullVal) - ($scope.alert1 - $scope.fullVal)) / ($scope.emptyVal - $scope.fullVal)) * 100);
              $scope.altStatus1 = '';
            }

            if ($scope.pointSettingData.alarmSecondCheck === null) {
              $scope.addAlt2Class = 'alertLight';
              $scope.disAlt2 = '';
              $scope.altStatus2 = 'Disabled';
            } else {
              $scope.addAlt2Class = '';
              $scope.disAlt2 = Math.round(((($scope.emptyVal - $scope.fullVal) - ($scope.alert2 - $scope.fullVal)) / ($scope.emptyVal - $scope.fullVal)) * 100);
              $scope.altStatus2 = '';
            }

            if ($scope.pointSettingData.alarmThirdCheck === null) {
              $scope.addAlt3Class = 'alertLight';
              $scope.disAlt3 = '';
              $scope.altStatus3 = 'Disabled';
            } else {
              $scope.addAlt3Class = '';
              $scope.disAlt3 = Math.round(((($scope.emptyVal - $scope.fullVal) - ($scope.alert3 - $scope.fullVal)) / ($scope.emptyVal - $scope.fullVal)) * 100);
              $scope.altStatus3 = '';
            }

          }
        }).catch(function (error) {
          $scope.alarmCount = 0;
          $scope.emptyVal = 3998;
          $scope.fullVal = 400;
          $scope.showAlert1 = false;
          $scope.showAlert2 = false;
          $scope.showAlert3 = false;
          $scope.alert1 = '';
          $scope.alert2 = '';
          $scope.alert3 = '';
          // Error callback, handle the error here
          console.error('Error occurred:', error);
        });
      };



      // ledgend marker filteration

      $scope.addMarker1 = function (type) {


        $scope.isLoading = true;
        const query = $http.get(apiBaseUrl + "newtraknetApiList?type=" + type, { headers: customeHeader }).then(function (res) {
          const response = res.data.data;
          const response_pointDis = res.data.pointDis;

          var convertedData = [];

          for (var i = response.length - 1; i > 0; i--) {
            var data = response[i];
            var objectId = data._id.$oid;

            var existingObject = convertedData.find(
              (obj) => obj.locationID === objectId
            );

            if (!existingObject) {

              if (data.point.angle > 5) {
                var angleColorRank = 1;
                var angleColor = "Red";
                var angle_alarm_tr = "Angle alarm Triggered";
              } else {
                var angleColorRank = 3;
                var angleColor = "Green";
                var angle_alarm_tr = "";
              }

              var distanceValue = parseInt(data.point.height);
              var dis_color_rank = 3;
              var dis_color = "Green";
              var distance_alarm_tr = " - ";

              if (data.point.height > 3998) {
                var dis_color_rank = 3;
                var dis_color = "";
                var distanceValue = "";
              }
              if (data.point.height < 400) {
                var distanceValue = 400;
                var distance_alarm_tr = "Distance alarm Triggered";
                var dis_color_rank = 1;
                var dis_color = "Red";
              }

              if (data.point.height < data.point.distance_alert) {
                var distance_alarm_tr = "Distance alert Triggered";
                var dis_color_rank = 2;
                var dis_color = "yellow";
              }

              if (data.point.manhole_level_alarm == "Not full alarm") {
                var manhole_level_alarm = 0;
              } else {
                var manhole_level_alarm = 1;
              }

              if (data.manhole_level_alarm == "Not moved") {
                var manhole_moved_alarm = 0;
              } else {
                var manhole_moved_alarm = 1;
              }

              if (parseInt(data.point.created_at.$date.$numberLong)) {
                const convertDateStringToISOString = function (dateString) {
                  const dateArray = dateString.split("_");
                  const datePart = dateArray[0].split("-").map(Number);
                  const timePart = dateArray[1].split("-").map(Number);

                  // Note: Months in JavaScript Date are zero-based (0-11)
                  const date = new Date(Date.UTC(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]));
                  return date;
                };

                const inputDateString = data.point.date;
                const ttemp = convertDateStringToISOString(inputDateString);
                const specificDate = moment(ttemp).tz("Asia/Singapore");

                const currentDate = moment().tz("Asia/Singapore");
                var timeDiff = Math.abs(currentDate - specificDate);

                var cd = 24 * 60 * 60 * 1000;
                var hValue = Math.floor(timeDiff / cd);
                if (hValue > 25) {
                  var lastComm = "Communications alarm Triggered";
                  var lastCommColor = 3;
                } else {
                  var lastComm = "";
                  var lastCommColor = "";
                }

                if (timeDiff < 1000) {
                  //miliseconds
                  var hours = timeDiff + " ms";
                } else if (timeDiff >= 1000 && timeDiff < 60000) {
                  //seconds
                  var hours = ((timeDiff % 60000) / 1000).toFixed(0) + "s";
                } else if (timeDiff >= 60000 && timeDiff < 3600000) {
                  //mins
                  var hours =
                    Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)) +
                    "min";
                } else if (timeDiff >= 3600000 && timeDiff < 86400000) {
                  //hours
                  var hours = Math.floor(timeDiff / 3600000) + "h";
                } else if (timeDiff >= 86400000 && timeDiff < 2592000000) {
                  //day
                  var hours = Math.floor(timeDiff / cd) + "d";
                } else if (timeDiff >= 2592000000 && timeDiff < 31536000000) {
                  //week
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60)) + "wk";
                } else {
                  //year
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60)) + "y";
                }

                var timeDate = hours;
                data.ts = hours + " ago";
                var totalSeconds = timeDiff;
                data.totalSeconds = totalSeconds;
              }

              var convertedPoint = {
                locationID: data._id.$oid,
                address:
                  data.location.street +
                  " " +
                  data.location.city +
                  " " +
                  data.location.tz,
                location: data.point._id.$oid,
                latitude: parseFloat(data.location.latitude),
                longitude: parseFloat(data.location.longitude),
                city: data.location.city,
                serialNumber: data.product.id_serial,
                installationId: data.point._id.$oid,
                installationName: data.treenode.textLabel,
                angle: parseInt(data.point.angle),
                angleColorRank: parseInt(angleColorRank),
                angleColor: angleColor,
                angle_alarm_tr: angle_alarm_tr,
                lastCommColorRank: lastCommColor,
                lastComm_alarm_tr: lastComm,
                last_communication: timeDiff,
                manhole_level_alarm: manhole_level_alarm,
                manhole_moved_alarm: manhole_moved_alarm,
                status: "all clear",
                color: "green",
                oldest_comm_date: timeDate,
                customDistance: 500,
                area: data.location.street,
                batteryStatus: data.point.manholeBatteryStatusValue,
                batteryVolt: data.point.battery_voltage,
                distance: distanceValue,
                disColorRank: parseInt(dis_color_rank),
                disColor: dis_color,
                distance_alarm_tr: distance_alarm_tr,
                distanceValue: distanceValue,
                levelAlarm: data.point.manholeLevelAlarmValue,
                movedAlarm: data.point.moved_alarm,
                signalStrength: data.point.signal_strength,
                temperature: data.point.temperature,
                ts: data.ts,
                height: data.point.height,
              };

              convertedData.push(convertedPoint);
            }
          }

          const mergedArray = convertedData.map(item1 => {
            const matchingItem2 = response_pointDis.find(item2 => item2.id_serial === item1.serialNumber);
            if (matchingItem2) {

              var distanceObjectValid = false;
              try {
                JSON.parse(matchingItem2.distance_alert);
                distanceObjectValid = true;
              } catch (e) {
                distanceObjectValid = false;
              }

              if (distanceObjectValid && matchingItem2.distance_alert !== null && matchingItem2.distance_alert !== '') {
                var point_alt = JSON.parse(matchingItem2.distance_alert);
              } else {
                var point_alt = { alarmFirstCheck: 0, alarmSecondCheck: 0, alarmThirdCheck: 0, alert1: 400, alert2: 400, alert3: 400, full: 400, empty: 3998 }
              }
              return {
                ...item1,
                totalAlerts: point_alt,
                aCheck1: point_alt.alarmFirstCheck ?? 0,
                aCheck2: point_alt.alarmSecondCheck ?? 0,
                aCheck3: point_alt.alarmThirdCheck ?? 0,
                alertOne: (point_alt.alert1) ? parseInt(point_alt.alert1) : 400,
                alertTwo: (point_alt.alert2) ? parseInt(point_alt.alert2) : 400,
                alertThree: (point_alt.alert3) ? parseInt(point_alt.alert3) : 400,
                empty: (point_alt.empty) ? parseInt(point_alt.empty) : 3998,
                full: (point_alt.full) ? parseInt(point_alt.full) : 400,
                relative_distance: Math.round(((((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400) - (item1.distance - (point_alt.full) ? parseInt(point_alt.full) : 400)) / ((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400)) * 100),
              };
            }
            return item1;
          });

          const aLocation = mergedArray;
          $scope.dataLocation = aLocation;

          const sorter = (a, b) => {
            return a.last_communication - b.last_communication;
          };

          const sortByLastComm = (arr) => {
            arr.sort(sorter);
          };

          var arrRed__1_1 = [];
          var arrRed__1_2 = [];
          var arrRed__2_1 = [];
          var arrRed__1_3 = [];
          var arrRed__3_1 = [];
          var arrYellow_2_2 = [];
          var arrYellow_2_3 = [];
          var arrYellow_3_3 = [];
          var arrYellow_3_2 = [];

          for (var i = 0; i < $scope.dataLocation.length; i++) {
            if ($scope.dataLocation[i].hasOwnProperty('full')) {
              $scope.fullVal = $scope.dataLocation[i].full;
            }

            if ($scope.dataLocation[i].hasOwnProperty('empty')) {
              $scope.emptyVal = $scope.dataLocation[i].empty;
            }

            $scope.dataLocation[i]['relative_distance'] = Math.round(((($scope.emptyVal - $scope.fullVal) - ($scope.dataLocation[i].distance - $scope.fullVal)) / ($scope.emptyVal - $scope.fullVal)) * 100);

            if ($scope.dataLocation[i]['relative_distance'] < 0) {
              $scope.dataLocation[i]['relative_distance'] = 0;
            }
            if ($scope.dataLocation[i]['relative_distance'] > 100) {
              $scope.dataLocation[i]['relative_distance'] = 100;
            }
            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__1_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 2) {
              arrRed__1_2.push($scope.dataLocation[i]);
            }
            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__2_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 1 && $scope.dataLocation[i].angleColorRank == 3) {
              arrRed__1_3.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 1) {
              arrRed__3_1.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 2) {
              arrYellow_2_2.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 2 && $scope.dataLocation[i].angleColorRank == 3) {
              arrYellow_2_3.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 2) {
              arrYellow_3_2.push($scope.dataLocation[i]);
            }

            if ($scope.dataLocation[i].disColorRank == 3 && $scope.dataLocation[i].angleColorRank == 3) {
              arrYellow_3_3.push($scope.dataLocation[i]);
            }
          }

          connCatArr_1 = arrRed__1_3.concat(arrRed__3_1);
          connCatArr_2 = arrYellow_2_3.concat(arrYellow_3_2);

          sortByLastComm(arrRed__1_1);
          sortByLastComm(arrRed__1_2);
          sortByLastComm(arrRed__2_1);
          sortByLastComm(connCatArr_1);
          sortByLastComm(connCatArr_2);
          sortByLastComm(arrYellow_3_3);

          $scope.sortedArray = arrRed__1_1.concat(arrRed__1_2);
          $scope.sortedArray = $scope.sortedArray.concat(arrYellow_2_2);

          $scope.sortedArray = $scope.sortedArray.concat(arrRed__2_1);
          $scope.sortedArray = $scope.sortedArray.concat(connCatArr_1);
          $scope.sortedArray = $scope.sortedArray.concat(connCatArr_2);
          $scope.sortedArray = $scope.sortedArray.concat(arrYellow_3_3);

          for (var k = 0; k < $scope.sortedArray.length; k++) {

            last_comm_split = $scope.sortedArray[k].oldest_comm_date.split(" ");

            if (last_comm_split[1] == "minutes" || last_comm_split[1] == "minute") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "min";

            }
            else if (last_comm_split[1] == "hours" || last_comm_split[1] == "hour") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "h";

            }
            else if (last_comm_split[1] == "day" || last_comm_split[1] == "days") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "d";

            }
            else if (last_comm_split[1] == "weeks" || last_comm_split[1] == "week") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "wk";

            }
            else if (last_comm_split[1] == "month" || last_comm_split[1] == "months") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "mo";

            }
            else if (last_comm_split[1] == "second" || last_comm_split[1] == "seconds") {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0] + "s";

            }
            else {
              $scope.sortedArray[k].oldest_comm_date = last_comm_split[0];
            }
          }

          $scope.sortedArray_1 = $scope.sortedArray;

          // sorted end
          for (var i = 0; i < $scope.sortedArray_1.length; i++) {
            arr.push(aLocation[i].installationId.split(" ")[0]);

            let dict = {};
            dict["id"] = aLocation[i].installationId.split(" ")[0];
            dict["latitude"] = aLocation[i].latitude;
            dict["longitude"] = aLocation[i].longitude;
            dict["distance"] = aLocation[i].distance;
            dict['relative_distance'] = aLocation[i].relative_distance;
            dict['distance_main'] = aLocation[i].distance;
            dict["angle"] = aLocation[i].angle;
            dict["status"] = aLocation[i].status;
            dict["address"] = aLocation[i].address;
            dict["installationName"] = aLocation[i].installationName;
            dict["city"] = aLocation[i].city;
            dict["infoBox"] = null;
            dict["serial_no"] = aLocation[i].serialNumber;
            dict["colorRank"] = aLocation[i].disColorRank;
            dict["colorRank2"] = aLocation[i].angleColorRank;
            dict['totalAlerts'] = {
              'al1': aLocation[i].alertThree,
              'al2': aLocation[i].alertTwo,
              'al3': aLocation[i].alertOne
            }
            dict['chk1'] = aLocation[i].aCheck1;
            dict['chk2'] = aLocation[i].aCheck2;
            dict['chk3'] = aLocation[i].aCheck3;
            let marker = buildMarker(dict);
            dict["marker"] = marker;
            dict["point"] = marker.point;
            $scope.displayData.push(dict);
          }
        }).catch(function (error) {
          if (error.status == 401) {
            $window.localStorage.removeItem('authToken');
            $rootScope.storage.loggedIn = false;
            $rootScope.storage.authToken = false;
            $rootScope.storage.$reset();
            $scope.refreshPage();
            $state.go('login');
          }
        })
          .finally(function () {
            $scope.isLoading = false;
          });


      }



      /*open the poppup form click on setting icon in info window*/
      $scope.counter = 0;
      $scope.confirmCheck = function () {
        if ($scope.showAlert1 === true && $scope.showAlert2 === true && $scope.showAlert3 === true) {
          $scope.disClass = 'disable-alert';
        }
      }


      $scope.openDeleteWindow = function () {
        $scope.activeBtn = true;
        alert("Choose Alert!")
      }

      $scope.disableAlertModal = function () {
        $scope.deleteModel = false;
        $scope.addClass = '';
      }


      $scope.removeAllAlerts = function () {
        $scope.showAlert1 = false;
        $scope.showAlert2 = false;
        $scope.showAlert3 = false;
        $scope.counter = 0;
        $scope.disClass = '';
        $scope.delClass = 'disable-alert';
        $scope.values = [];
      }

      $scope.values = [];
      $scope.addAlertValue = function () {
        var alertVal = '';
        var alertVal = parseInt(angular.element($("#alert")).val());
        var alert1Val = parseInt(angular.element($("#alert1")).val());
        var alert2Val = parseInt(angular.element($("#alert2")).val());
        let full = angular.element($("#fullValue")).val();
        let empty = angular.element($("#emptyValue")).val();

        if (typeof $scope.pointSettingData != 'undefined') {
          if ($scope.pointSettingData.alert1) {
            if (!$scope.values.includes(alertVal)) {
              $scope.values.push($scope.pointSettingData.alert1);
            }
          }
          if ($scope.pointSettingData.alert2) {
            if (!$scope.values.includes(alertVal)) {
              $scope.values.push($scope.pointSettingData.alert2);
            }

          }
          if ($scope.pointSettingData.alert3) {
            if (!$scope.values.includes(alertVal)) {
              $scope.values.push($scope.pointSettingData.alert3);
            }
          }
        }

        if (alert1Val >= 0) {
          $scope.delClass = '';
        }

        if (!alertVal) {
          $scope.alertError = true;
          $scope.errMsg = "Alert Value is Required";
          return;
        }

        let fullAlarm = (full) ? full : 400;
        let emptyAlarm = (empty) ? empty : 3998;

        if (parseInt(alertVal) && parseInt(alertVal) < fullAlarm) {
          $scope.alertError = true;
          $scope.errMsg = "Alert Should be >= 'Full 100%' value or 400";
          return;
        }

        if (parseInt(alertVal) && parseInt(alertVal) >= emptyAlarm) {
          $scope.alertError = true;
          $scope.errMsg = "Alert Should be <= 'Empty 0%' value or 3998";
          return;
        }

        if ($scope.values.includes(alertVal)) {
          // If the value already exists, do not add it again
          $scope.alertError = true;
          $scope.errMsg = "Alert Value already exists.";
          return;
        } else {

          // Add the value to the array
          $scope.alertError = '';

          if (!$scope.values.includes(alertVal)) {
            $scope.values.push(alertVal);
          }

          if ($scope.values.length >= 3) {
            $scope.disClass = 'disable-alert';
          }

          // Sort the array in ascending order
          $scope.values.sort(function (a, b) {
            return a - b;
          });

          // Update input boxes with sorted values
          $scope.alert1 = $scope.values[0] || 0;
          $scope.alert2 = $scope.values[1] || 0;
          $scope.alert3 = $scope.values[2] || 0;

          if ($scope.alert1 > 0) {
            $scope.showAlert1 = true;
          } else {
            $scope.showAlert1 = false;
          }
          if ($scope.alert2 > 0) {
            $scope.showAlert2 = true;
          } else {
            $scope.showAlert2 = false;
          }
          if ($scope.alert3 > 0) {
            $scope.showAlert3 = true;
          } else {
            $scope.showAlert3 = false;
          }
          // If the newly entered value is larger than the last value, move it to the last input box
          if (alertVal > $scope.values[2]) {
            $scope.alert3 = alertVal;
          }
        }

        $scope.alert = '';
        $scope.alertError = false;
        // Close the modal
        document.getElementById("myModal2").style.display = "none";
      };



      /**This function is use to set false if user will select cancle, go back button while adding alerts */
      $scope.closeAddAlertModal = function () {
        $scope.values = [];
        if ($scope.counter == 1) {
          $scope.showAlert1 = false;
          $scope.delClass = 'disable-alert';
          $scope.counter = 0;
        }
        if ($scope.counter == 2) {
          $scope.showAlert2 = false;
          $scope.counter = 2;
        }
        if ($scope.counter == 3) {
          $scope.showAlert3 = false;
          $scope.counter = 3;
          $scope.disClass = 'disable-alert';
        }
      }
      /** ends */


      /** Disable/Enable or Delete alerts starts */
      $scope.onDecreaseAlertNumber = function (arg) {
        $scope.deleteModel = true;
        if (arg == 'Alert1') {
          $scope.disableAlertArray.alt1 = true;
          $scope.deleteAlertArray.al1 = true;
          $scope.addAlt1Class = 'alertLight';
          if ($scope.pointSettingData) {
            if ($scope.pointSettingData.alarmFirstCheck == 0) {
              $scope.btnValue = 'Enable';
              $scope.addAlt1Class = '';
            } else {
              $scope.btnValue = 'Disable';
              $scope.addAlt1Class = 'alertLight';
            }
          }
        }
        if (arg == 'Alert2') {
          $scope.disableAlertArray.alt2 = true;
          $scope.deleteAlertArray.al2 = true;
          $scope.addAlt2Class = 'alertLight';
          if ($scope.pointSettingData) {
            if ($scope.pointSettingData.alarmSecondCheck == 0) {
              $scope.btnValue = 'Enable';
              $scope.addAlt2Class = '';
            } else {
              $scope.btnValue = 'Disable';
              $scope.addAlt2Class = 'alertLight';
            }
          }
        }
        if (arg == 'Alert3') {
          $scope.disableAlertArray.alt3 = true;
          $scope.deleteAlertArray.al3 = true;
          $scope.addAlt3Class = 'alertLight';
          if ($scope.pointSettingData) {
            if ($scope.pointSettingData.alarmThirdCheck == 0) {
              $scope.btnValue = 'Enable';
              $scope.addAlt3Class = '';
            } else {
              $scope.btnValue = 'Disable';
              $scope.addAlt3Class = 'alertLight';
            }
          }
        }
        doConfirm("Select Option You Want To Perform!", function yes() {
          $scope.disableAlertArray;
          $scope.enableBtn = true;
          $scope.deleteBtn = false;
          //delete all alerts
        }, function no() {
          $scope.deleteAlertArray;
          $scope.deleteBtn = true;
          $scope.enableBtn = false;
        });
      }
      /** ends */



      // Onchange event


      $scope.onInputChange = function (inputName) {
        $timeout(function () {
          var alert1Value = parseInt($scope.alert1);
          var alert2Value = parseInt($scope.alert2);
          var alert3Value = parseInt($scope.alert3);
          $scope.errorAlt1 = ''; $scope.errorAlt2 = ''; $scope.errorAlt3 = '';

          let full = angular.element($("#fullValue")).val();
          let empty = angular.element($("#emptyValue")).val();

          // Sort the alert values
          const values = [alert1Value, alert2Value, alert3Value];
          var sortedValues = values.filter(value => !isNaN(value)).sort(function (a, b) {
            return a - b;
          });


          let newValue = parseInt($scope[inputName]);
          let fullAlarm = (full) ? full : 400;
          let emptyAlarm = (empty) ? empty : 3998;

          if (!isNaN(newValue)) {
            // Check for duplicate values
            var duplicateIndexes = [];
            for (var i = 0; i < sortedValues.length - 1; i++) {
              if (sortedValues[i] === sortedValues[i + 1]) {
                duplicateIndexes.push(i);
              }
            }
            if (inputName === "fullVal") {

              if (fullAlarm >= 400 && fullAlarm <= 3998) {
                $scope.bOneErr = false;
                $scope.errorfull = '';
              } else {
                $scope.bOneErr = true;
                $scope.errorfull = "Invalid value*";
                $scope.errorstatus = true;
                return false;
              }

              if (alert3Value < fullAlarm) {
                $scope.bOneErr = true;
                $scope.errorfull = "Full Should be <= 'Every Alert value'";
                $scope.errorstatus = true;
                return false;
              }
              if (alert2Value < fullAlarm) {
                $scope.bOneErr = true;
                $scope.errorfull = "Full Should be <= 'Every Alert value'";
                $scope.errorstatus = true;
                return false;
              }
              if (alert1Value < fullAlarm) {
                $scope.bOneErr = true;
                $scope.errorfull = "Full Should be <= 'Every Alert value'";
                $scope.errorstatus = true;
                return false;
              }
              $scope.errorstatus = false;
              $scope.bOneErr = false;
              $scope.errorfull = '';
            }

            if (inputName === "emptyVal") {

              if ((emptyAlarm <= 3998)) {
                $scope.bTwoErr = false;
                $scope.errorempty = '';
              } else {
                $scope.bTwoErr = true;
                $scope.errorempty = "Invalid value*";
                $scope.errorstatus = true;
                return false;
              }

              if (alert3Value > emptyAlarm) {
                $scope.bTwoErr = true;
                $scope.errorempty = "Empty Should be >= Every Alert value";
                $scope.errorstatus = true;
                return false;
              }
              if (alert2Value > emptyAlarm) {
                $scope.bTwoErr = true;
                $scope.errorempty = "Empty Should be >= Every Alert value";
                $scope.errorstatus = true;
                return false;
              }
              if (alert1Value > emptyAlarm) {
                $scope.bTwoErr = true;
                $scope.errorempty = "Empty Should be >= Every Alert value";
                $scope.errorstatus = true;
                return false;
              }
              $scope.errorstatus = false;
              $scope.bTwoErr = false;
              $scope.errorempty = ''
            }

            if (duplicateIndexes.length > 0) {
              $scope.errorstatus = true;
              if (inputName === "alert1") {
                $scope.alrErr = true;
                $scope.errorAlt1 = 'Duplicate Alert!'; // Set error message
                return;
              }
              if (inputName === "alert2") {
                $scope.alrErr = true;
                $scope.errorAlt2 = 'Duplicate Alert!'; // Set error message
                return;
              }
              else {
                $scope.alrErr = true;
                $scope.errorAlt3 = 'Duplicate Alert!'; // Set error message
                return;
              }

            }
            else if (parseInt(newValue) < fullAlarm) {
              $scope.errorstatus = true;
              if (inputName === "alert1") {
                $scope.alrErr = true;
                $scope.errorAlt1 = "Alert Should be >= 'Full 100%' value or " + fullAlarm; // Set error message
                return false;
              }
              if (inputName === "alert2") {
                $scope.alrErr = true;
                $scope.errorAlt2 = "Alert Should be >= 'Full 100%' value or " + fullAlarm; // Set error message
                return false;
              }
              if (inputName === "alert3") {
                $scope.alrErr = true;
                $scope.errorAlt3 = "Alert Should be >= 'Full 100%' value or " + fullAlarm; // Set error message
                return false;
              }
            }
            else if (parseInt(newValue) > emptyAlarm) {
              $scope.errorstatus = true;
              if (inputName === "alert1") {
                $scope.alrErr = true;
                $scope.errorAlt1 = "Alert Should be <= 'Empty 0%' value or " + emptyAlarm; // Set error message
                return false;
              }
              if (inputName === "alert2") {
                $scope.alrErr = true;
                $scope.errorAlt2 = "Alert Should be <= 'Empty 0%' value or " + emptyAlarm; // Set error message
                return false;
              }
              if (inputName === "alert3") {
                $scope.alrErr = true;
                $scope.errorAlt3 = "Alert Should be <= 'Empty 0%' value or " + emptyAlarm; // Set error message
                return false;
              }
            }
            else {
              $scope.errorstatus = false;
              $scope.errorempty = '';
              $scope.errorfull = '';
              $scope.alert1 = sortedValues[2];
              $scope.alert2 = sortedValues[1];
              $scope.alert3 = sortedValues[0];
            }


            if ($scope.alert3 === undefined) {
              $scope.addAlt3Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt3 = '';
              $scope.altStatus3 = 'Disabled';
            }
            if ($scope.alert2 === undefined) {
              $scope.addAlt2Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt2 = '';
              $scope.altStatus2 = 'Disabled';
            }
            if ($scope.alert1 === undefined) {
              $scope.addAlt1Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt1 = '';
              $scope.altStatus1 = 'Disabled';
            }
            if ($scope.alert1 < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt1 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }
            if ($scope.alert2 < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt2 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }
            if ($scope.alert3 < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt3 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }

            if ($scope.alert1) {
              $scope.addAlt1Class = '';
              $scope.altStatus1 = '';
              $scope.disAlt1 = Math.round((((emptyAlarm - fullAlarm) - ($scope.alert1 - fullAlarm)) / (emptyAlarm - fullAlarm)) * 100);
            }
            if ($scope.alert2) {
              $scope.addAlt2Class = '';
              $scope.altStatus2 = '';
              $scope.disAlt2 = Math.round((((emptyAlarm - fullAlarm) - ($scope.alert2 - fullAlarm)) / (emptyAlarm - fullAlarm)) * 100);
            }
            if ($scope.alert3) {
              $scope.addAlt3Class = '';
              $scope.altStatus3 = '';
              $scope.disAlt3 = Math.round((((emptyAlarm - fullAlarm) - ($scope.alert3 - fullAlarm)) / (emptyAlarm - fullAlarm)) * 100);
            }
          } else {

            if (alert1Value < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt1 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }
            if (alert2Value < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt2 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }
            if (alert3Value < fullAlarm) {
              $scope.errorstatus = true;
              $scope.alrErr = true;
              $scope.errorAlt3 = "Alert Should be >= 'Full 100%' value or " + fullAlarm;
              return;
            }
            if (inputName == "alert1") {
              $scope.addAlt1Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt1 = '';
              $scope.altStatus1 = 'Disabled';
            }
            if (inputName == "alert2") {
              $scope.addAlt2Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt2 = '';
              $scope.altStatus2 = 'Disabled';
            }
            if (inputName == "alert3") {
              $scope.addAlt3Class = 'alertLight';
              $scope.errorstatus = false;
              $scope.disAlt3 = '';
              $scope.altStatus3 = 'Disabled';
            }
          }
        }, 1000); // 3000 milliseconds = 3 seconds
      };

      /*Close Model*/
      $scope.closeModal = function () {
        $scope.showModal = false;
        $scope.errorAlt1 = ''; $scope.errorAlt2 = ''; $scope.errorAlt3 = '';
        $scope.disAlt1 = ''; $scope.disAlt2 = ''; $scope.disAlt3 = '';
      };
      /*End*/

      //  Reset Alert function
      $scope.resetAlert = function () {
        $scope.errorstatus = false;
        $scope.errorAlt1 = '';
        $scope.errorAlt2 = '';
        $scope.errorAlt3 = '';
        $scope.addAlt1Class = 'alertLight';
        $scope.disAlt1 = '';
        $scope.alert1 = '';
        $scope.altStatus1 = 'Disabled';
        $scope.addAlt2Class = 'alertLight';
        $scope.disAlt2 = '';
        $scope.alert2 = '';
        $scope.altStatus2 = 'Disabled';
        $scope.addAlt3Class = 'alertLight';
        $scope.disAlt3 = '';
        $scope.alert3 = '';
        $scope.altStatus3 = 'Disabled';

      };


      /*saving relative distance alerts*/
      // $scope.saveAlertData = function(){
      //   var node_id = localStorage.getItem("node_id");
      //   $scope.bench_height = angular.element($("#bench_height")).val();
      //   $scope.angel_alarm = angular.element($("#angel_alarm")).val();
      //   var distance = angular.element($("#distance_alarm")).val() || 0;
      //   $scope.distance_alarm = distance;
      //   $scope.serialNo = angular.element($("#serialNumber")).val();
      //   $scope.checkVal = angular.element($("#enableDistanceAlarm")).val();
      //   if ($scope.checkVal == "") $scope.checkVal = 0;
      //   else $scope.checkVal = angular.element($("#enableDistanceAlarm")).val();
      //   //alert(angular.element($(".alertNumber")).val());return;


      //   const enabled = 1;
      //   var node_name = localStorage.getItem("node_name");
      //   var val = angular.element($(".alertNumber")).val();
      //   var alertF = angular.element($('#alert1')).val();
      //   var alertS = angular.element($('#alert2')).val();
      //   var alertT = angular.element($('#alert3')).val();

      //   if( alertF ) {
      //     $scope.alert1 = alertF;
      //     $scope.alarmFirstCheck = enabled;	
      //   }  else {
      //     $scope.alert1 = null;
      //     $scope.alarmFirstCheck = null;	
      //   }

      //   if( alertS ) {
      //     $scope.alert2 = alertS;
      //     $scope.alarmSecondCheck = enabled;	
      //   } else {
      //     $scope.alert2 = null;
      //     $scope.alarmSecondCheck = null;
      //   }

      //   if( alertT) {
      //     $scope.alert3 = alertT;
      //     $scope.alarmThirdCheck = enabled;	
      //   } else {
      //     $scope.alert3 = null;
      //     $scope.alarmThirdCheck = null;
      //   }
      //   /** disable starts*/
      //   if( $scope.enableBtn ) {
      //     if( 'alt1' in $scope.disableAlertArray && $scope.disableAlertArray.alt1 === true && 'alarmFirstCheck' in $scope.pointSettingData ) {
      //       if($scope.pointSettingData.alarmFirstCheck === 0) {
      //         $scope.alarmFirstCheck = 1;
      //       } else {
      //         $scope.alarmFirstCheck = null;
      //       }
      //     }

      //     if( 'alt2' in $scope.disableAlertArray && $scope.disableAlertArray.alt2 === true && 'alarmSecondCheck' in $scope.pointSettingData ) {
      //       if($scope.pointSettingData.alarmSecondCheck === 0) {
      //         $scope.alarmSecondCheck = 1;
      //       } else {
      //         $scope.alarmSecondCheck = null;
      //       }
      //     }

      //     if( 'alt3' in $scope.disableAlertArray && $scope.disableAlertArray.alt3 === true && 'alarmThirdCheck' in $scope.pointSettingData ) {//console.log("3 disable");
      //       if($scope.pointSettingData.alarmThirdCheck === 0) {
      //         $scope.alarmThirdCheck = 1;
      //       } else {
      //         $scope.alarmThirdCheck = null;
      //       }
      //     }
      //   }
      //   //console.log( $scope.alarmFirstCheck ,$scope.alarmSecondCheck , $scope.alarmThirdCheck, "checks")
      //   //console.log( $scope.disableAlertArray ,$scope.disableAlertArray.alt2 == true, "disableAlertArray" );
      //   //return;
      //   /** ends */    

      //   $scope.fullValue = angular.element($('#fullValue')).val();
      //   $scope.emptyValue = angular.element($('#emptyValue')).val();
      //   if( !$scope.fullValue || !$scope.emptyValue) {
      //     alert("Setting Boundaries are Required")
      //     return;
      //   }

      //   if( $scope.fullValue < 400 ) {
      //     alert("Full Value Should be >= 400")
      //     return false;
      //   }

      //   if( parseInt($scope.emptyValue) <  parseInt($scope.fullValue) ) { 
      //     alert("Full Value Should be less than Empty Value")
      //     return false;
      //   }

      //   if( parseInt($scope.emptyValue) < parseInt($scope.fullValue) ) {
      //     alert("Empty Value Should be greater than Full Value")
      //     return false;
      //   }

      //   if(parseInt($scope.emptyValue) < parseInt(alertF) || parseInt($scope.emptyValue) < parseInt(alertS) || parseInt($scope.emptyValue) < parseInt(alertT)) {
      //     alert("Invalid Alert Value")
      //     return false;
      //   }

      //   if( parseInt($scope.emptyValue) > 3998 ) {
      //     alert("Empty Value Should be less than equal to 3998")
      //     return false;
      //   }

      //   if( parseInt(alertF) < parseInt($scope.fullValue) && parseInt(alertF) > parseInt($scope.emptyValue) ) {
      //     alert("Alert Values Should be in between Full and Empty value")
      //     return false;
      //   }
      //   if( parseInt(alertS) < parseInt($scope.fullValue) && parseInt(alertS) > parseInt($scope.emptyValue) ) {
      //     alert("Alert Values Should be in between Full and Empty value")
      //     return false;
      //   }
      //   if( parseInt(alertT) < parseInt($scope.fullValue) && parseInt(alertT) > parseInt($scope.emptyValue) ) {
      //     alert("Alert Values Should be in between Full and Empty value")
      //     return false;
      //   }

      //   let formData = {
      //     "pointId": node_id,
      //     "distance_alert": {
      //       "full": $scope.fullValue,
      //       "empty": $scope.emptyValue,  
      //       "alert1": $scope.alert1, 
      //       "alert2": $scope.alert2,
      //       "alert3": $scope.alert3,
      //       "alarmFirstCheck": $scope.alarmFirstCheck,
      //       "alarmSecondCheck": $scope.alarmSecondCheck,
      //       "alarmThirdCheck": $scope.alarmThirdCheck
      //     }
      //   };


      //   $http.post(apiBaseUrl+"add-user-definded-distancealert",formData, {headers:customeHeader}).then(function (response) {
      //     if (response.data.status) {
      //       // alert("Data Saved");

      //       Swal.fire({
      //         title: 'Alert Saved',
      //         text: '',
      //         icon: 'success',
      //         allowOutsideClick: false, // Disable interactions with the background
      //         showCancelButton: false, // Hide the cancel button
      //         confirmButtonColor: '#3085d6',
      //         confirmButtonText: 'OK'
      //       }).then((result) => {  
      //         if (result.isConfirmed) {
      //           $window.location.reload();
      //         }
      //       });


      //       $("#popupModalCenter").removeClass("show-modal");
      //     } else if (data.status == 400) {
      //       $("#popupModalCenter").removeClass("show-modal");
      //     }
      //   }).catch(function(error){
      //     if(error.status==401){
      //       $window.localStorage.removeItem('authToken');
      //       $rootScope.storage.loggedIn = false;
      //       $rootScope.storage.authToken = false;
      //       $rootScope.storage.$reset();
      //       $scope.refreshPage();
      //       $state.go('login');
      //     }
      //   });


      //   // $scope.serialNo = $scope.productIMEI;
      //   // const portalRef = '2b930eb1-94544585';
      //   // const query = `yvw_manhole_specification_01a( { productRef: read(product and productModelRef == 2ac7d4be-00e6238c and id_serial == "${$scope.serialNo}")->id, empty:${$scope.emptyValue}, full:${$scope.fullValue}, alarmFirst: ${$scope.alert1},alarmFirstCheck: ${$scope.alarmFirstCheck}, alarmSecond: ${$scope.alert2}, alarmSecondCheck: ${$scope.alarmSecondCheck} ,alarmThird: ${$scope.alert3}, alarmThirdCheck: ${$scope.alarmThirdCheck} },"${ node_name.trim()}", ${portalRef}, ${$scope.deleteBtn})`;
      //   // // console.log(query,"query");
      //   // // return;
      //   // Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function(response){
      //   //   const data = response.data.rows[0];
      //   //     if(data.status == 200){
      //   //       alert("Alert Saved!");
      //   //       $window.location.reload();
      //   //     }
      //   //     else if(data.status == 400) {
      //   //       alert(data.msg);
      //   //       $("#popupModalCenter").removeClass("show-modal");
      //   //     }
      //   // });


      // };



      //   ===============================================


      /*saving relative distance alerts*/
      $scope.saveAlertData = function () {
        const enabled = 1;
        var node_id = localStorage.getItem("node_id");
        var val = angular.element($(".alertNumber")).val();
        var alertF = angular.element($('#alert1')).val();
        var alertS = angular.element($('#alert2')).val();
        var alertT = angular.element($('#alert3')).val();

        if (alertF) {
          $scope.alert1 = alertF;
          $scope.alarmFirstCheck = enabled;
        } else {
          $scope.alert1 = null;
          $scope.alarmFirstCheck = null;
        }

        if (alertS) {
          $scope.alert2 = alertS;
          $scope.alarmSecondCheck = enabled;
        } else {
          $scope.alert2 = null;
          $scope.alarmSecondCheck = null;
        }

        if (alertT) {
          $scope.alert3 = alertT;
          $scope.alarmThirdCheck = enabled;
        } else {
          $scope.alert3 = null;
          $scope.alarmThirdCheck = null;
        }
        /** disable starts*/
        if ($scope.enableBtn) {
          if ('alt1' in $scope.disableAlertArray && $scope.disableAlertArray.alt1 === true && 'alarmFirstCheck' in $scope.pointSettingData) {
            if ($scope.pointSettingData.alarmFirstCheck === 0) {
              $scope.alarmFirstCheck = 1;
            } else {
              $scope.alarmFirstCheck = null;
            }
          }

          if ('alt2' in $scope.disableAlertArray && $scope.disableAlertArray.alt2 === true && 'alarmSecondCheck' in $scope.pointSettingData) {
            if ($scope.pointSettingData.alarmSecondCheck === 0) {
              $scope.alarmSecondCheck = 1;
            } else {
              $scope.alarmSecondCheck = null;
            }
          }

          if ('alt3' in $scope.disableAlertArray && $scope.disableAlertArray.alt3 === true && 'alarmThirdCheck' in $scope.pointSettingData) {//console.log("3 disable");
            if ($scope.pointSettingData.alarmThirdCheck === 0) {
              $scope.alarmThirdCheck = 1;
            } else {
              $scope.alarmThirdCheck = null;
            }
          }
        }
        //console.log( $scope.alarmFirstCheck ,$scope.alarmSecondCheck , $scope.alarmThirdCheck, "checks")
        //console.log( $scope.disableAlertArray ,$scope.disableAlertArray.alt2 == true, "disableAlertArray" );
        //return;
        /** ends */


        $scope.fullValue = angular.element($('#fullValue')).val();
        $scope.emptyValue = angular.element($('#emptyValue')).val();
        if (!$scope.fullValue || !$scope.emptyValue) {
          alert("Setting Boundaries are Required")
          return;
        }

        if ($scope.fullValue < 400) {
          alert("Full Value Should be >= 400")
          return false;
        }

        if (parseInt($scope.emptyValue) < parseInt($scope.fullValue)) {
          alert("Full Value Should be less than Empty Value")
          return false;
        }

        if (parseInt($scope.emptyValue) < parseInt($scope.fullValue)) {
          alert("Empty Value Should be greater than Full Value")
          return false;
        }

        if (parseInt($scope.emptyValue) < parseInt(alertF) || parseInt($scope.emptyValue) < parseInt(alertS) || parseInt($scope.emptyValue) < parseInt(alertT)) {
          alert("Invalid Alert Value")
          return false;
        }

        if (parseInt($scope.emptyValue) > 3998) {
          alert("Empty Value Should be less than equal to 3998")
          return false;
        }

        if (parseInt(alertF) < parseInt($scope.fullValue) && parseInt(alertF) > parseInt($scope.emptyValue)) {
          alert("Alert Values Should be in between Full and Empty value")
          return false;
        }
        if (parseInt(alertS) < parseInt($scope.fullValue) && parseInt(alertS) > parseInt($scope.emptyValue)) {
          alert("Alert Values Should be in between Full and Empty value")
          return false;
        }
        if (parseInt(alertT) < parseInt($scope.fullValue) && parseInt(alertT) > parseInt($scope.emptyValue)) {
          alert("Alert Values Should be in between Full and Empty value")
          return false;
        }


        let formData = {
          "pointId": node_id,
          "distance_alert": {
            "full": $scope.fullValue,
            "empty": $scope.emptyValue,
            "alert1": $scope.alert1,
            "alert2": $scope.alert2,
            "alert3": $scope.alert3,
            "alarmFirstCheck": $scope.alarmFirstCheck,
            "alarmSecondCheck": $scope.alarmSecondCheck,
            "alarmThirdCheck": $scope.alarmThirdCheck
          }
        };

        $http.post(apiBaseUrl + "add-user-definded-distancealert", formData, { headers: customeHeader }).then(function (response) {

          const data = response.data;
          if (data.status) {
            //console.log(node_id,this,"new log");
            getInfoWinData($scope.nodes, $scope.markers)

            $window.Swal.fire({
              title: "Alert Saved!",
              text: " ",
              icon: "success"
            });
            $("#popupModalCenter").removeClass("show-modal");
            //html_aTreeNode_hisEndVal_02_c(, "")
          }
          else if (data.status == 400) {
            alert(data.msg);
            $("#popupModalCenter").removeClass("show-modal");
          }
        });
      };




      /*Zoom out marker location by the click on installation*/
      $scope.GetTableItemsByClick = function (item) {
        $scope.mapLocation(item);
      };

      /*Zoom out marker location by the selcted dropdown installation*/
      $scope.GetTableItemsBySlected = function (inst_item) {
        $scope.mapLocation(inst_item);
      };
      /*get the single lat and lng zoom the location marker*/
      $scope.mapLocation = function (dict) {
        if (typeof dict.latitude === "undefined" && typeof dict.longitude === "undefined")
          return;

        let alertObj = {
          'al1': dict.alertOne,
          'al2': dict.alertTwo,
          'al3': dict.alertThree
        };
        let alertArr = [];





        if (dict.aCheck1 == 1) {
          if (dict.distance <= dict.alertOne) {
            alertArr.push(dict.alertOne);
          }
        }
        if (dict.aCheck2 == 1) {
          if (dict.distance <= dict.alertTwo) {
            alertArr.push(dict.alertTwo);
          }
        }
        if (dict.aCheck3 == 1) {
          if (dict.distance <= dict.alertThree) {
            alertArr.push(dict.alertThree);
          }
        }

        if (dict.relative_distance < 0) {
          dict.relative_distance = 0;
        }
        if (dict.relative_distance > 100) {
          dict.relative_distance = 100;
        }

        var infowindow = new google.maps.InfoWindow({
          content: dict.relative_distance.toLocaleString() + "%" + ",  " + dict.angle + "\xBA",
        });

        var colorCode = dict.disColorRank;
        var colorCode2 = dict.angleColorRank;
        var imgpath = "";
        if (colorCode) {
          if (colorCode == 3 && colorCode2 == 3) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 3) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 2) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 1) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 2) {
            if (alertArr.length <= 1) {
              var result = getObjectKey(alertObj, alertArr[0]);
            }
            else {
              let value = closest(alertArr, dict.distance)
              var result = getObjectKey(alertObj, value);
            }

            if (result == 'al3') {
              imgpath = './img/triangle.svg';
            }

            if (result == 'al2') {
              imgpath = './img/square.svg';
            }

            if (result == 'al1') {
              imgpath = './img/circle.svg';
            }
          }
          if (colorCode == 2 && colorCode2 == 3) {


            if (alertArr.length <= 1) {
              var result = getObjectKey(alertObj, alertArr[0]);
            } else {
              let value = closest(alertArr, dict.distance)
              var result = getObjectKey(alertObj, value);
            }
           

            if (dict.distance == '') {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }

            if (alertArr.length == 0) {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }
            if (result == 'al3') {
              imgpath = './img/triangle.svg';
            }

            if (result == 'al2') {
              imgpath = './img/square.svg';
            }

            if (result == 'al1') {
              imgpath = './img/circle.svg';
            }


            if (parseInt(dict.height) < 400) {
              imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
            }
          }
          if (colorCode == 3 && colorCode2 == 2) {
            var imgpath = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          }
        }

        let point = { lat: dict.latitude, lng: dict.longitude };
        const mapOptions = {
          center: point,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          disableDefaultUI: true,
          zoom: 20,
        };
        const map = new google.maps.Map(
          document.getElementById("homeMap"),
          mapOptions
        );
        let iconPath = imgpath;
        let iconTemp = {
          url: iconPath,
          size: new google.maps.Size(40, 40),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        };
        beachMarker[dict.installationId.split(" ")[0]] = new google.maps.Marker(
          {
            position: point,
            map: map,
            icon: iconTemp,
            title: dict.installationName,
            id: dict.installationId.split(" ")[0],
          }
        );
        beachMarker[dict.installationId.split(" ")[0]].addListener(
          "click",
          function () {
            infowindow.open(
              map,
              beachMarker[dict.installationId.split(" ")[0]]
            );
          }
        );
        infowindow.open(map, beachMarker[dict.installationId.split(" ")[0]]);
        beachMarker[dict.installationId.split(" ")[0]].addListener(
          "click",
          function () {
            infowindow.close();
            const node = dict;

            if (node === null) return;
            getInfoWinData(node, this);
          }
        );

        reCenterMap(point);
        return {
          id: dict.installationId.split(" ")[0],
          point: point,
          marker: beachMarker[dict.installationId.split(" ")[0]],
        };
      };
      $scope.resetMapClick = function () {
        $scope.refreshPage();
      };

      $scope.distanceAlert;
    });


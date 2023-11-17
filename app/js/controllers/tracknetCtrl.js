angular
  .module("tracknetCtrl", []).service('LocationDataService', function () {
    this.locationData = {};
  }).controller(
    "tracknetController",
    function (
      $window,
      $scope,
      $rootScope,
      $http,
      Data,
      $q,
      $timeout,
      $interval,
      $filter,
      apiBaseUrl,
      LocationDataService
    ) {

      localStorage.setItem("trackNet", '');
      const portalRef = "64ad1af2664396439a286273"; //tracnet trial 20230703
      const dataPickerFormat = "D/MM/YYYY";
      const skySparkFormat = "YYYY-MM-DD";
      $scope.isFirstLoad = true;
      $scope.isFirstLoadAlarm = true;
      $scope.clockTime = function () {
        $scope.time = moment().utcOffset("+08:00").format("h:mm:ss a");
        $scope.date = moment().utcOffset("+08:00").format("ddd, MMM Do YYYY");
      };


      $scope.clockTime();
      $interval($scope.clockTime, 1000);
      $scope.blockExpandLeft = false;
      $scope.blockExpandRight = false;
      $scope.isLoading = false;


      $scope.serverRequest = apiBaseUrl;
      const token = localStorage.getItem("authToken");
      const customeHeader = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };


      $("#singleDate").daterangepicker(
        {
          singleDatePicker: true,
          showDropdowns: true,
          minYear: 2020,
          startDate: moment(),
        },
        function (start) {
          $scope.singleDate = start.format(skySparkFormat);
          localStorage.setItem("singleDate", $scope.singleDate);
        }
      );

      const initZoomLevel = 11; //IS-384
      const finalZoomLevel = 20;
      let tracknetMap = document.getElementById("tracknetMap");
      /**IS-404 starts - custom style for removing all unwanted markers from map*/
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
      /**IS-404 ends*/
      const map = new google.maps.Map(tracknetMap, {
        //zoom: initZoomLevel,//IS-384 //IS-394 remove setZoom as no need when map is seting as per marker points
        center: new google.maps.LatLng(-28.033546, 153.381246), //IS-384
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        fullscreenControl: false,
        styles: styles,
      });
      var infoWindow = new google.maps.InfoWindow();
      tracknetMap.gMap = map;
      tracknetMap.infoWindow = infoWindow;
      tracknetMap.marker = [];
      tracknetMap.isZoomed = false;
      if (tracknetMap.gMap.getStreetView()) {
        tracknetMap.gMap.getStreetView().enableCloseButton = false;
        tracknetMap.gMap.getStreetView().addListener("visible_changed", () => {
          if (tracknetMap.gMap.getStreetView().getVisible()) {
            $("#exitStreetView").show();
          } else {
            $("#exitStreetView").hide();
          }
        });
      }
      $scope.chartLabel = ["Angle", "Relative Distance"];

      $scope.$watch("singleDate", function (newDate, oldDate) {
        if (newDate == undefined) return;
        $("#singleDate span").html(moment(newDate).format(dataPickerFormat));
        $scope.loadData(true);
        loadRelativeDistance();
      });
      $scope.nextPrevClick = function (direction) {
        let start = localStorage.getItem("singleDate");
        if (direction == "left") {
          start = moment(start).subtract(1, "day");
        } else {
          start = moment(start).add(1, "day");
        }
        $("#singleDate").data("daterangepicker").setStartDate(start);
        $("#singleDate").data("daterangepicker").setEndDate(start);
        $scope.singleDate = start.format(skySparkFormat);
        localStorage.setItem("singleDate", $scope.singleDate);
      };
      $scope.singleDate = moment().format(skySparkFormat);
      localStorage.setItem("singleDate", $scope.singleDate);
      // $('#singleDate span').html(moment().format(dataPickerFormat));

      $scope.device = {};
      $scope.locationData = LocationDataService.locationData;
      $scope.serialNo = "";
      $scope.$on("serialNumber", function (e, serialNumber) {
        $scope.serialNo = serialNumber;
      });
      $scope.$watch("serialNo", function (index) {
        if (index == undefined) return;
        if ($scope.locationData[index] == undefined) {
          document.getElementById("myDiv").innerHTML = "";
        } else {
          document.getElementById("myDiv").innerHTML =
            $scope.locationData[index].marker.sensorContent;
        }
      });
      $scope.apiUrlAlarm = "";
      $scope.loadData = function (initset, customParam = "") {
        localStorage.setItem("paramval", customParam);
        console.log(initset, customParam)
        $scope.device = {};
        /** IS-384 - change old api tracNet_getAllInstallations_02_a with new tracNet_getAllInstallations_03_a http://127.0.0.1:8000/api/v1/ */
        // Define the API URL based on the isFirstLoad flag
        if (customParam == '') {
          var apiUrl = $scope.isFirstLoad ? apiBaseUrl + "newtraknetApiList" : apiBaseUrl + "newtraknetApiList/" + localStorage.getItem("singleDate");
        } else {
          var apiUrl = customParam ? apiBaseUrl + "newtraknetApiList" : apiBaseUrl + "newtraknetApiList/" + localStorage.getItem("singleDate");
        }


        $http
          .get(apiUrl, { headers: customeHeader })
          .then(function (res) {
            const response = res.data.data;
            const response_pointDis = res.data.pointDis;

            var allconvertedData = [];

            for (var i = response.length - 1; i > 0; i--) {
              var data = response[i];
              var objectId = data.product.id_serial;

              var existingObject = allconvertedData.find(
                (obj) => obj.serialNumber === objectId
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
                var distance_alarm_tr = "";

                if (data.point.height > 3998) {
                  var dis_color_rank = 3;
                  var dis_color = "Green";
                }
                if (parseInt(data.point.height) <= 400) {
                  var distanceValue = 400;
                  var distance_alarm_tr = "Distance alarm Triggered";
                  var dis_color_rank = 1;
                  var dis_color = "Red";
                } else if (data.point.height < data.point.distance_alert) {
                  var distance_alarm_tr = "Distance alert Triggered";
                  var dis_color_rank = 2;
                  var dis_color = "orange";
                } else {
                  var dis_color_rank = 3;
                  var dis_color = "Green";
                }

                /** map markers shape starts */
                var markerShape = "Green";
                if (data.point.angle > 5) {
                  var markerShape = "Red";
                }

                else if (data.point.height < 400) {
                  var markerShape = "Red";
                }
                else {
                  var closestValue = closest({ 'al1': parseInt(data.point.alert1), 'al2': parseInt(data.point.alert2), 'al3': parseInt(data.point.alert3) }, data.point.height);

                  if (data.point.alert1 != null && data.point.height < data.point.alert1 && data.point.alarmFirstCheck != null && data.point.alarmFirstCheck == 1 && parseInt(data.point.alert1) == closestValue) {
                    var markerShape = "circle";
                  }
                  if (data.point.alert2 != null && data.point.height < data.point.alert2 && data.point.alarmSecondCheck != null && data.point.alarmSecondCheck == 1 && parseInt(data.point.alert2) == closestValue) {
                    var markerShape = "square";
                  }

                  if (data.point.alert3 != null && data.point.height < data.point.alert3 && data.point.alarmThirdCheck != null && data.point.alarmThirdCheck == 1 && parseInt(data.point.alert3) == closestValue) {
                    var markerShape = "triangle";
                  }
                }
                /** ends */

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

                if (data.point.date) {
                  var timeDate = data.point.date;
                }
                var angleValue = parseInt(data.point.angle);

                var convertedPoint = {
                  installationName: data.treenode.textLabel,
                  locationID: data.location._id.$oid,
                  address: data.location.street + " " + data.location.city + " " + data.location.tz,
                  location: data.point._id.$oid,
                  latitude: parseFloat(data.location.latitude),
                  longitude: parseFloat(data.location.longitude),
                  city: data.location.city,
                  serialNumber: data.product.id_serial,
                  installationId: data.treenode._id.$oid,

                  angle: angleValue,
                  angleColorRank: angleColorRank,
                  angleColor: angleColor,
                  angle_alarm_tr: angle_alarm_tr,

                  lastCommColorRank: 0,
                  lastComm_alarm_tr: "",
                  last_communication: 9,
                  manhole_level_alarm: manhole_level_alarm,
                  manhole_moved_alarm: manhole_moved_alarm,
                  status: localStorage.getItem("paramval"),
                  color: "Green",
                  oldest_comm_date: "2 days ago",
                  customDistance: 500,
                  area: data.location.street,
                  batteryStatus: data.point.battery_status,
                  batteryVolt: data.point.battery_voltage,
                  distance: distanceValue,
                  disColorRank: dis_color_rank,
                  disColor: dis_color,
                  distance_alarm_tr: distance_alarm_tr,
                  distanceValue: distanceValue,
                  levelAlarm: data.point.manholeLevelAlarm,
                  movedAlarm: data.point.manholeMovedAlarm,
                  signalStrength: data.point.signal_strength,
                  temperature: data.point.temperature,
                  ts: timeDate,
                  realts: data.point.created_at,

                  data: {
                    shape: markerShape,
                    city: data.location.city,
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                    state: data.location.state,
                    street: data.location.street,
                    tz: data.location.tz,
                  },
                };
                allconvertedData.push(convertedPoint);
              }
            }

            const convertedData = allconvertedData.map(item1 => {
              const matchingItem2 = response_pointDis.find(item2 => item2.id_serial === item1.serialNumber);
              if (matchingItem2) {
                try {
                  JSON.parse(matchingItem2.distance_alert);
                  distanceObjectValid = true;
                } catch (e) {
                  distanceObjectValid = false;
                }
                if (distanceObjectValid && matchingItem2.distance_alert !== null) {
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
                  alertOne: (point_alt.alert1) ? parseInt(point_alt.alert1) : 0,
                  alertTwo: (point_alt.alert2) ? parseInt(point_alt.alert2) : 0,
                  alertThree: (point_alt.alert3) ? parseInt(point_alt.alert3) : 0,
                  empty: (point_alt.empty) ? parseInt(point_alt.empty) : 3998,
                  full: (point_alt.full) ? parseInt(point_alt.full) : 400,
                  shape: 'red',
                  relative_distance: Math.round(((((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400) - (item1.distance - (point_alt.full) ? parseInt(point_alt.full) : 400)) / ((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400)) * 100),
                };
              }
              return item1;
            });


            for (i = 0; i < convertedData.length; i++) {
              if ($scope.device[convertedData[i].serialNumber] == undefined)
                $scope.device[convertedData[i].serialNumber] = [];
              let eachData = convertedData[i];
              $scope.device[convertedData[i].serialNumber].push(eachData);

            }
            let queriesArray = [];

            var i = 0;
            for (var index in $scope.device) {

              if ($scope.device[index].length) {
                if (convertedData[i]) {

                  // if( customParam == "") {
                  //   queriesArray.push({ index: index, query: convertedData[i].data });
                  // }
                  // if( customParam == "all alarms"){
                  //   if (convertedData[i].angle >= 5) {
                  //     queriesArray.push({ index: index, query: convertedData[i].data });
                  //   }
                  //   if (convertedData[i].distance <= 400) {
                  //     queriesArray.push({ index: index, query: convertedData[i].data });
                  //   }
                  // }                  
                  // if (customParam == 'all clear') {
                  //   queriesArray.push({ index: index, query: convertedData[i].data });
                  // }
                  // if (customParam == 'triangle') {
                  //   queriesArray.push({ index: index, query: convertedData[i].data });
                  // }
                  // if (customParam == 'square') {
                  //   queriesArray.push({ index: index, query: convertedData[i].data });
                  // }
                  // if (customParam == 'circle') {
                  //   queriesArray.push({ index: index, query: convertedData[i].data });
                  // }
                  queriesArray.push({ index: index, query: convertedData[i].data });
                }
                i++;
              }
            }

            if (queriesArray.length > 0) {
              let promises_data = queriesArray.map(function (item) {
                return {
                  idx: item.index,
                  data: item.query
                };
              });


              $q.all(promises_data).then(function (responses) {

                if (responses.length !== queriesArray.length) return;
                for (let j = 0; j < responses.length; j++) {
                  if (initset && !isIwOpen() && j == 0) {
                    $scope.serialNo = responses[j].idx;
                  }

                  if ($scope.locationData[responses[j].idx] == undefined) {
                    $scope.locationData[responses[j].idx] = $scope.device[responses[j].idx][$scope.device[responses[j].idx].length - 1];
                    $scope.locationData[responses[j].idx].position = responses[j].data[0];
                  }
                  if (customParam == "") {
                    $scope.locationData[responses[j].idx] = $scope.device[responses[j].idx][$scope.device[responses[j].idx].length - 1];
                    $scope.locationData[responses[j].idx].position = responses[j].data[0];
                    $scope.locationData[responses[j].idx].marker = createMarker($scope.locationData[responses[j].idx], responses[j].idx);

                  } else {
                    if ((customParam == "all clear" && responses[j].data.shape == 'Green') || (customParam == "all alarms" && responses[j].data.shape == 'Red') || (customParam == "triangle" && responses[j].data.shape == 'triangle') || (customParam == "square" && responses[j].data.shape == 'square') || (customParam == "circle" && responses[j].data.shape == 'circle')) {
                      $scope.locationData[responses[j].idx].marker.setMap(tracknetMap.gMap);
                    } else {
                      $scope.locationData[responses[j].idx].marker.setMap(null);
                    }

                  }

                }


                if (document.getElementById('myDiv')) document.getElementById('myDiv').innerHTML = $scope.locationData[$scope.serialNo].marker.sensorContent;
                $scope.updateChartConfig();
                if (initset && !(tracknetMap.isZoomed || isIwOpen())) $scope.recenterMap(false);
                if ($scope.serialNo != '') updateOpenedInfowidow($scope.locationData[$scope.serialNo].marker);
              });
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
            $scope.isFirstLoad = false;
          });
      };

      function updateOpenedInfowidow(marker) {
        if (isIwOpen()) {
          tracknetMap.infoWindow.setContent(
            "<h2>" + marker.title + "</h2>" + marker.content
          );
        }
      }

      function isIwOpen() {
        var getmap = tracknetMap.infoWindow.getMap();
        return getmap !== null && typeof getmap !== "undefined";
      }

      function closest(obj, num) {
        var array = Object.values(obj);

        var i = 0;
        var minDiff = 1000;
        var ans;
        for (i in array) {
          var diff = array[i] - num;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            ans = array[i];
          }
        }
        return ans;
      }

      function getObjectKey(obj, value) {
        if (obj && typeof obj === 'object') {
          const keys = Object.keys(obj);
          const keyWithMatchingValue = keys.find(key => obj[key] === value);

          if (keyWithMatchingValue != undefined) {
            return keyWithMatchingValue;
          }
        }

        return null; // or some other default value/error handling logic
      }


      function getMarkerColor(info, customParam = "") {

        //console.log(info,'info.disColorRankinfo.disColorRankinfo.disColorRankinfo.disColorRank');
        let alertArr = [];
        if (info.aCheck1 == 1) {
          alertArr.push(info.alertOne);
          var dict = {
            'al1': info.alertOne,
            'al2': info.alertTwo,
            'al3': info.alertThree
          }
        }
        if (info.aCheck2 == 1) {
          alertArr.push(info.alertTwo);
          var dict = {
            'al1': info.alertOne,
            'al2': info.alertTwo,
            'al3': info.alertThree
          }
        }
        if (info.aCheck3 == 1) {
          alertArr.push(info.alertThree);
          var dict = {
            'al1': info.alertOne,
            'al2': info.alertTwo,
            'al3': info.alertThree
          }
        }


        if (customParam == "") {
          if (info.disColorRank == 3 && info.angleColorRank == 3) return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          if (info.disColorRank == 3 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          if (info.disColorRank == 1 && info.angleColorRank == 3) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          if (info.disColorRank == 1 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          if (info.disColorRank == 1 && info.angleColorRank == 2) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          if (info.disColorRank == 2 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        } else {
          if (customParam == "all alarms") {
            return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          } else if (customParam == "all clear") {
            return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          } else if (info.data.shape == "triangle") {
            return './img/triangle-01.png';
          } else if (info.data.shape == "square") {
            return './img/square-01.png';
          } else if (info.data.shape == "circle") {
            return './img/circle-01.png';
          }
        }
        if (info.disColorRank == 2 && info.angleColorRank == 2) {
          console.log(alertArr, 'alertArralertArralertArralertArralertArr');
          var value = closest(alertArr, dict.distance);
          var result = getObjectKey(dict, value);
          if (result == 'al3') {
            imgpath = './img/triangle-01.png';
          }
          if (result == 'al2') {
            imgpath = './img/square-01.png';
          }

          if (result == 'al1') {
            imgpath = './img/circle-01.png';
            console.log(result, 'result al1 2 or 2')
          }
          return imgpath;
        }
        else {
          imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        }
        if (info.disColorRank == 2 && info.angleColorRank == 3) {
          var value = closest(alertArr, info.distanceValue);
          var result = getObjectKey(dict, value);

          if (result == 'al3') {
            imgpath = './img/triangle-01.png';
          }

          if (result == 'al2') {
            imgpath = './img/square-01.png';
          }

          if (result == 'al1') {
            imgpath = './img/circle-01.png';
          }
          return imgpath;
        } else {
          imgpath = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        }
        if (info.disColorRank == 3 && info.angleColorRank == 2) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

      }

      const convertDateStringToISOString = function (dateString) {
        const dateArray = dateString.split("_");
        const datePart = dateArray[0].split("-").map(Number);
        const timePart = dateArray[1].split("-").map(Number);

        // Note: Months in JavaScript Date are zero-based (0-11)
        const date = new Date(Date.UTC(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]));

        return date;
      };

      function createMarker(info) {
        let customParam = localStorage.getItem("paramval");
        const markericon = getMarkerColor(info, customParam);
        // const markericon = getMarkerColor(info);
        var marker = new google.maps.Marker({
          map: map,
          position: new google.maps.LatLng(info.latitude, info.longitude),
          title: info.installationName,
          id: info.serialNumber,
          disableDefaultUI: true,
          icon: {
            url: markericon,
          },
        });
        const inputDateString = info.ts;
        const ttemp = convertDateStringToISOString(inputDateString);
        const singaporeTime = moment(ttemp).tz("Asia/Singapore");
        var timee = singaporeTime.format("h:mm:ss A");
        var datee = singaporeTime.format("ddd, MMMM Do YYYY");
        if (
          (info.location == "undefined") |
          (info.location == "undefined undefined")
        )
          info.installationLocation = "Custom Location";
        else info.installationLocation = info.location;

        if (info.city == "undefined") info.installationCity = "Custom City";
        else info.installationCity = info.city;

        if (info.area == "undefined" || info.area == "")
          info.area = "Custom Area";
        else info.area = info.area;

        var distance_value = "";

        if (info.distance > 400) {
          distance_value = info.distance;
        }
        else {
          distance_value = 400;
        }
        if (info.distance > 3998) {
          distance_value = "";
        }


        var distanceHeight = parseInt(info.distanceValue);
        if (distanceHeight > 3998) {
          distanceHeight = "";
        }
        if (distanceHeight < 400) {
          distanceHeight = 400;
        }

        if (info.totalAlerts != undefined) {

          var relativeDistanceCal = Math.round((((info.empty - info.full) - (info.distanceValue - info.full)) / (info.empty - info.full)) * 100)
          if (relativeDistanceCal < 0) {
            relativeDistanceCal = 0;
          }
          if (relativeDistanceCal > 100) {
            relativeDistanceCal = 100;
          }
        } else {

          var relativeDistanceCal = Math.round((((3998 - 400) - (info.distanceValue - 400)) / (3998 - 400)) * 100)
          if (relativeDistanceCal < 0) {
            console.log(info.distanceValue, info, "height");
            relativeDistanceCal = 0;
          }
          if (relativeDistanceCal > 100) {
            relativeDistanceCal = 100;
          }

        }


        marker.content =
          '<div class="infoWindowContent">' +
          "<b>Last Data: </b>" +
          datee +
          " " +
          timee +
          "<br>" + //IS-384 rename label name suggested by client
          "<b>Street: </b>" +
          info.area +
          "<br>" +
          "<b>City: </b>" +
          info.installationCity +
          "<br>" +
          "<b>Distance: </b>" +
          distance_value.toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          " mm<br>" +
          "<b>Relative Distance: </b>" + relativeDistanceCal + ' %<br>' +
          "<b>Angle: </b>" +
          info.angle +
          " deg<br>" +
          "<b>Temperature: </b>" +
          info.temperature +
          " °C<br>" +
          "<b>Signal Strength: </b>" +
          Math.trunc(info.signalStrength).toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          " dBm<br>" +
          "<b>Battery Status: </b>" +
          info.batteryVolt +
          " V<br>" +
          "</div>";

        /**IS-416 starts*/
        var streetCityName = info.area + ", " + info.installationCity;

        /*IS-416 ends*/
        marker.sensorContent =
          '<div class="history_block" >' +
          '<div class="history_block" >' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i>' +
          info.installationName +
          "<br>" +
          streetCityName +
          ' <span class="data-date"></span> </li>' + //IS-416
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Last Communication Timestamp:</span> ' +
          datee +
          " " +
          timee +
          '</span> <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Relative Distance: </span>' + relativeDistanceCal + ' % <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Distance:</span> ' +
          distance_value.toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          ' mm <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Angle: </span>' +
          info.angle +
          ' deg <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Temprature: </span>' +
          info.temperature +
          ' °C<span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Battery Voltage:</span> ' +
          info.batteryVolt +
          ' V <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Signal Strength:</span> ' +
          Math.trunc(info.signalStrength).toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          ' dBm <span class="data-date"></span> </li>' +
          "</div>";
        ("</div>");

        marker.addListener("click", function () {
          let markers = tracknetMap.marker;
          for (var i = markers.length - 1; i >= 0; i--) {
            if (markers[i].id == this.id) {
              tracknetMap.infoWindow.setContent(
                "<h2>" +
                $scope.locationData[markers[i].id].installationName +
                "</h2>" +
                markers[i].content
              );
              $scope.locationData[this.id].marker = markers[i];

              break;
            }
          }
          infoWindow.open(map, this);
          $scope.$emit("serialNumber", this.id);
        });

        tracknetMap.marker.push(marker);
        return marker;
      }

      $scope.triggerMarkerClick = function () {
        if (isIwOpen()) {
          $timeout(function () {
            let markers = tracknetMap.marker;
            for (var i = markers.length - 1; i >= 0; i--) {
              if (markers[i].id == $scope.serialNo) {
                google.maps.event.trigger(markers[i], "click");
              }
            }
          }, 100);
        }
      };

      $scope.zoomMapClick = function () {
        if (tracknetMap.isZoomed) return;
        if (typeof $scope.locationData[$scope.serialNo] != "undefined") {
          tracknetMap.isZoomed = true;
          tracknetMap.gMap.setZoom(finalZoomLevel);
          tracknetMap.gMap.setCenter(
            $scope.locationData[$scope.serialNo].marker.getPosition()
          );
          $scope.triggerMarkerClick();
        }
      };

      $scope.recenterMap = function () {
        var bounds = new google.maps.LatLngBounds();
        for (var i in $scope.locationData) {
          bounds.extend($scope.locationData[i].marker.getPosition());
        }
        tracknetMap.gMap.fitBounds(bounds);
        tracknetMap.gMap.setCenter(bounds.getCenter());
        //tracknetMap.gMap.setZoom(initZoomLevel);
        $scope.triggerMarkerClick();

      };

      $scope.exitStreetViewMap = function () {
        tracknetMap.gMap.getStreetView().setVisible(false);
      };

      $scope.resetMapClick = function () {
        if (tracknetMap.gMap.getStreetView().getVisible()) {
          tracknetMap.gMap.getStreetView().setVisible(false);
        }
        if (tracknetMap.isZoomed) {
          tracknetMap.isZoomed = false;
          tracknetMap.infoWindow.close();
          $scope.recenterMap();
        } else {
          if (isIwOpen()) {
            tracknetMap.infoWindow.close();
          }
          infoWindow.close();
          $scope.recenterMap();
        }
        let params = localStorage.getItem("paramval");
        if (params != "") {
          localStorage.setItem("trackNet", 'trackNet');
          window.location.reload();
        }
      };

      $scope.realtimesummery = {
        options: {
          chart: {
            plotBackgroundColor: "#18223e",
            plotBorderWidth: 0,
            plotShadow: false,
            type: "pie",
            height: 220,
            spacing: [10, 10, 5, 10],
            margin: [0, 0, 0, 0],
          },
          tooltip: {
            enabled: false,
          },
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: false,
              },
              startAngle: -90,
              borderWidth: 0,
              center: ["50%", "33%"],
              innerSize: "60%",
              size: 100,
              showInLegend: true,
              states: {
                inactive: {
                  opacity: 0.4,
                },
              },
            },
          },
          legend: {
            layout: "vertical",
            labelFormatter: function () {
              return this.name + " (" + this.y + ")";
            },
            itemStyle: {
              color: "#FFFFFF",
              fontFamily: "var(--bs-font-sans-serif)",
              fontWeight: "500",
            },
            itemHoverStyle: {
              color: "#BCBCBC",
            },
          },
        },
        series: [
          {
            type: "pie",
            name: "Real-Time Summary",
            data: [
              {
                name: "All Clear",
                y: 0,
                color: "#00CC99",
              },
              {
                name: "Distance Alert",
                y: 0,
                color: "#ffa500",
              },
              {
                name: "Alarms",
                y: 0,
                color: "#FF5050",
              },
            ],
          },
        ],
        title: {
          text: "Real-Time Summary",
          margin: 0,
          style: {
            color: "#FFFFFF",
            fontSize: "12px",
            fontFamily: "var(--bs-font-sans-serif)",
            fontWeight: "500",
          },
        },
      };

      $scope.alertCount = 0;
      $scope.alertLists = [];

      $scope.alertClick = function (alert) {
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(
          $scope.locationData[alert.product_serialNumber].marker.getPosition()
        );
        tracknetMap.gMap.fitBounds(bounds);
        tracknetMap.gMap.setCenter(bounds.getCenter());
        tracknetMap.gMap.setZoom(finalZoomLevel);
        tracknetMap.isZoomed = true;

        let responses = [
          {
            idx: alert.product_serialNumber,
            data: $scope.locationData[alert.product_serialNumber],
          },
        ];

        const installationDetails = $scope.locationData[responses[0].idx];
        showMarker(installationDetails);
        if (document.getElementById("myDiv"))
          document.getElementById("myDiv").innerHTML =
            $scope.locationData[
              alert.product_serialNumber
            ].marker.sensorContent;
        $scope.updateChartConfig();
        let initset = true;
        tracknetMap.infoWindow.close();
        if (initset && !(tracknetMap.isZoomed || isIwOpen()))
          $scope.recenterMap(false);
        if (alert.product_serialNumber != "")
          updateOpenedInfowidow(
            $scope.locationData[alert.product_serialNumber].marker
          );
      };

      var last_comm_split = null;

      /*alertlist sorting*/
      function customComparator(a, b) {
        function extractHours(timeString) {
          if (timeString.endsWith('d')) {
            return parseInt(timeString) * 24; // Convert days to hours
          } else if (timeString.endsWith('h')) {
            return parseInt(timeString);
          } else if (timeString.endsWith('min')) {
            return parseInt(timeString) / 60;
          } else {
            return 0;
          }
        }

        const hoursA = extractHours(a.oldest_comm_date);
        const hoursB = extractHours(b.oldest_comm_date);

        return hoursA - hoursB;
      }


      function alarmApi() {
        $scope.realtimesummery.series[0].data[0].y = 0;
        $scope.realtimesummery.series[0].data[1].y = 0;
        $scope.realtimesummery.series[0].data[2].y = 0;
        $http
          .get(
            apiBaseUrl + "newtraknetApiList", { headers: customeHeader }
          )
          .then(function (res) {
            const response = res.data.data;
            const response_pointDis = res.data.pointDis;
            var allconvertedDatas = [];
            for (var i = response.length - 1; i > 0; i--) {
              var data = response[i];
              var objectId = data.point.device_id;

              var existingObject = allconvertedDatas.find(
                (obj) => obj.product_serialNumber === objectId
              );


              if (!existingObject) {
                if (Number(data.point.angle) >= 5) {
                  var angleColorRank = 1;
                  var angleColor = "Red";
                  var angle_alarm_tr = "Angle alarm Triggered";
                } else {
                  var angleColorRank = 3;
                  var angleColor = "Green";
                  var angle_alarm_tr = "";
                }


                if (Number(data.point.height) <= 400) {
                  // var distanceValue = 400;
                  var distance_alarm_tr = "Distance alarm Triggered";
                  var dis_color_rank = 1;
                  var dis_color = "Red";
                } else {
                  var dis_color_rank = 3;
                  var dis_color = "Green";
                  var distance_alarm_tr = "";
                }

                var distanceAlertValue = parseInt(data.point.distance_alert);
                if ("distance_alert" in data.point) {
                  if (data.point.height < data.point.distance_alert) {
                    var distance_alarm_tr = "Distance alert Triggered";
                    var dis_color_rank = 2;
                    var dis_color = "yellow";
                  }

                }

                var status = "";
                var disValue = "";
                if (Number(data.point.height) <= 400) {
                  status = "Distance alarms triggered";
                } else if (Number(data.point.angle) >= 5) {
                  status = "Angle alarms triggered";
                } else if (Number(data.point.height) <= 400 && Number(data.point.angle) >= 5) {
                  status = "all alarms triggered";
                } else if ("distance_alert" in data.point && Number(data.point.height) < distanceAlertValue) {
                  status = "Distance alert triggered";
                } else {
                  status = "all clear";
                }


                var currentDate = new Date();
                const singaporeCurrentTime = moment(currentDate).tz("Asia/Singapore");
                const ttemp = convertDateStringToISOString(data.point.date);
                const singaporeTime = moment(ttemp).tz("Asia/Singapore");
                var timeDiff = Math.abs(singaporeCurrentTime - singaporeTime);
                var cd = 24 * 60 * 60 * 1000;
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
                } else if (timeDiff >= 86400000 && timeDiff < 604800000) {
                  //day
                  var hours = Math.floor(timeDiff / cd) + "d";
                } else if (timeDiff >= 604800000 && timeDiff < 31536000000) {
                  //week
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + "wk";
                } else {
                  //year
                  var hours = Math.floor(timeDiff / (1000 * 60 * 60 * 60 * 24 * 365)) + "y";
                }

                var timeDate = hours;
                if (Number(data.point.height) < 400) {
                  var disValue = 400;
                } else if (Number(data.point.height) >= 3998) {
                  var disValue = "";
                } else {
                  var disValue = Number(data.point.height);
                }


                try {
                  JSON.parse(matchingItem2.distance_alert);
                  distanceObjectValid = true;
                } catch (e) {
                  distanceObjectValid = false;
                }

                if (distanceObjectValid && data.point.distance_alert) {
                  var distanceValue = JSON.parse(data.point.distance_alert);
                  var relativeDistanceCal = Math.round((((parseInt(distanceValue.empty) - (distanceValue.full)) - (disValue - parseInt(distanceValue.full))) / (parseInt(distanceValue.empty) - parseInt(distanceValue.full))) * 100)
                  if (relativeDistanceCal < 0) {
                    relativeDistanceCal = 0;
                  }
                  if (relativeDistanceCal > 100) {
                    relativeDistanceCal = 100;
                  }
                } else {

                  var relativeDistanceCal = Math.round((((3998 - 400) - (disValue - 400)) / (3998 - 400)) * 100)
                  if (relativeDistanceCal < 0) {

                    relativeDistanceCal = 0;
                  }
                  if (relativeDistanceCal > 100) {
                    relativeDistanceCal = 100;
                  }

                }
                var msg = "Relative Distance: " + relativeDistanceCal + " %, Angle: " + data.point.angle + " deg";

                var convertedAlertCountPoint = {
                  angle: data.point.angle,
                  angleColorRank: angleColorRank,
                  angleColor: angleColor,
                  angle_alarm_tr: angle_alarm_tr,
                  product_serialNumber: data.point.device_id,
                  distance: data.point.height,
                  disColorRank: dis_color_rank,
                  disColor: dis_color,
                  distance_alarm_tr: distance_alarm_tr,
                  distanceValue: data.point.height,
                  aTreeNodeRef: data.aTreeNodeRef.$oid,
                  aTreeNode_textLabel: data.point.textLabel,
                  latitude: parseFloat(data.location.latitude),
                  longitude: parseFloat(data.location.longitude),
                  message: msg,
                  status: status,
                  myTime: timeDate,
                  oldest_comm_date: timeDate,
                  last_comm_split: timeDate + " hours ago",
                  street: data.location.street,
                  city: data.location.city,
                  time: timeDate + " hours ago",
                  empty: data.point.empty !== null && data.point.empty !== undefined ? data.point.empty : "3998",
                  full: data.point.full,
                  alarmFirstCheck: data.point.alarmFirstCheck,
                  alarmSecondCheck: data.point.alarmSecondCheck,
                  alarmThirdCheck: data.point.alarmThirdCheck,
                  totalAlerts: {
                    'al1': data.point.alert1,
                    'al2': data.point.alert2,
                    'al3': data.point.alert3
                  }
                };

                allconvertedDatas.push(convertedAlertCountPoint);
              }
            }

            const convertedAlertCountData = allconvertedDatas.map(item1 => {
              const matchingItem2 = response_pointDis.find(item2 => item2.id_serial === item1.serialNumber);
              if (matchingItem2) {

                try {
                  JSON.parse(matchingItem2.distance_alert);
                  distanceObjectValid = true;
                } catch (e) {
                  distanceObjectValid = false;
                }

                if (distanceObjectValid && matchingItem2.distance_alert !== null) {
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
                  alertOne: point_alt.alert1,
                  alertTwo: point_alt.alert2,
                  alertThree: point_alt.alert3,
                  empty: (point_alt.empty) ? parseInt(point_alt.empty) : 3998,
                  full: (point_alt.full) ? parseInt(point_alt.full) : 400,
                  relative_distance: Math.round(((((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400) - (item1.distance - (point_alt.full) ? parseInt(point_alt.full) : 400)) / ((point_alt.empty) ? parseInt(point_alt.empty) : 3998 - (point_alt.full) ? parseInt(point_alt.full) : 400)) * 100),
                };
              }
              return item1;
            });

            var uniqueDataCount = [];
            var deviceIds = new Set(); // Using a Set to store unique device_ids

            // for (var i = 0; i < convertedAlertCountData.length; i++) {
            //   var data = convertedAlertCountData[i];
            //   if (!deviceIds.has(data.product_serialNumber)) {
            //     uniqueDataCount.push(data);
            //     deviceIds.add(data.product_serialNumber);
            //   }
            // }
            for (var i = 0; i < convertedAlertCountData.length; i++) {
              var data = convertedAlertCountData[i];
              if (!deviceIds.has(data.product_serialNumber)) {
                uniqueDataCount.push(data);
                deviceIds.add(data.product_serialNumber);
              }
            }

            for (var i = 0; i < uniqueDataCount.length; i++) {
              let distanceDataCValue = parseInt(uniqueDataCount[i].distance);
              if (uniqueDataCount[i].angle >= 5 || uniqueDataCount[i].distance <= 400) {
                $scope.realtimesummery.series[0].data[2].y++;
              }

              if (distanceDataCValue < parseInt(uniqueDataCount[i].totalAlerts.al1) && uniqueDataCount[i].alarmFirstCheck == 1 || distanceDataCValue < parseInt(uniqueDataCount[i].totalAlerts.al2) && uniqueDataCount[i].alarmSecondCheck == 1 || distanceDataCValue < parseInt(uniqueDataCount[i].totalAlerts.al3) && uniqueDataCount[i].alarmThirdCheck == 1 && uniqueDataCount[i].angle < 5) {
                $scope.realtimesummery.series[0].data[1].y++;
              }

              else if (uniqueDataCount[i].angle < 5 && uniqueDataCount[i].distance > 400 || (uniqueDataCount[i].alarmFirstCheck == 1 || uniqueDataCount[i].alarmSecondCheck == 1 || uniqueDataCount[i].alarmThirdCheck == 1) && (distanceDataCValue > parseInt(uniqueDataCount[i].totalAlerts.al1) || distanceDataCValue > parseInt(uniqueDataCount[i].totalAlerts.al2) || distanceDataCValue > parseInt(uniqueDataCount[i].totalAlerts.al3))) {
                $scope.realtimesummery.series[0].data[0].y++;
              }
              // if (uniqueDataCount[i].distance <= 400) {
              //   $scope.realtimesummery.series[0].data[2].y++;
              // }              

            }

            $scope.alertLists = uniqueDataCount;

            var uniqueAlertData = [];
            for (var i = 0; i < $scope.alertLists.length; i++) {

              let distanceValue = parseInt($scope.alertLists[i].distance);
              let angleValue = parseInt($scope.alertLists[i].angle);
              $scope.alertLists[i].class = "";


              if (angleValue >= 5 || $scope.alertLists[i].distance <= 400) {
                uniqueAlertData.push($scope.alertLists[i]);

                $scope.alertLists[i].class = "distance danger";
              }
              else {
                $scope.alertLists[i].class = "green";
              }
              if ($scope.alertLists[i].distance > 3998) {
                $scope.alertLists[i].class = "";
              }
              // if ($scope.alertLists[i].distance <= 400) {
              //   uniqueAlertData.push($scope.alertLists[i]);

              //   $scope.alertLists[i].class = "distance danger";
              // }
              else if (distanceValue < parseInt($scope.alertLists[i].totalAlerts.al1) && $scope.alertLists[i].alarmFirstCheck == 1 || distanceValue < parseInt($scope.alertLists[i].totalAlerts.al2) && $scope.alertLists[i].alarmSecondCheck == 1 || distanceValue < parseInt($scope.alertLists[i].totalAlerts.al3) && $scope.alertLists[i].alarmThirdCheck == 1 && $scope.alertLists[i].angle < 5) {
                uniqueAlertData.push($scope.alertLists[i]);
                $scope.alertLists[i].class = "distance warn";
              }


              last_comm_split = $scope.alertLists[i].oldest_comm_date.split(" ");

              if (last_comm_split[1] == "minutes" || last_comm_split[1] == "minute") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "min";
              } else if (last_comm_split[1] == "hours" || last_comm_split[1] == "hour") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "h";
              } else if (last_comm_split[1] == "day" || last_comm_split[1] == "days") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "d";
              } else if (last_comm_split[1] == "weeks" || last_comm_split[1] == "week") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "wk";
              } else if (last_comm_split[1] == "month" || last_comm_split[1] == "months") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "mo";
              } else if (last_comm_split[1] == "year" || last_comm_split[1] == "year") {
                $scope.alertLists[i].oldest_comm_date = last_comm_split[0] + "y";
              }
              // else {
              //   $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "y";
              // }
            }

            $scope.alertCount = uniqueAlertData.length;
            $scope.alertLists = uniqueAlertData.sort(customComparator);
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

      $scope.$on("$viewContentLoaded", function () {
        alarmApi();
      });

      $scope.meterChartConfig = [];

      $scope.updateChartConfig = function () {
        let data = [[], []];
        if ($scope.device[$scope.serialNo] != undefined) {
          for (let j = 0; j < $scope.device[$scope.serialNo].length; j++) {
            let eachEntry = $scope.device[$scope.serialNo][j];
            const ttemp = convertDateStringToISOString(eachEntry.ts);
            var mmx = moment.utc(ttemp);

            const xval = mmx.valueOf();
            if (!eachEntry.empty) {
              eachEntry.empty = 3998;
            }
            if (!eachEntry.full) {
              eachEntry.full = 400;
            }

            var relativeDistance = Math.round((((eachEntry.empty - eachEntry.full) - (eachEntry.distance - eachEntry.full)) / (eachEntry.empty - eachEntry.full)) * 100);

            if ($scope.checkRelativeDistanceSensor == "Relative Distance") {
              if (relativeDistance < 0) {
                relativeDistance = 0;
              }
              if (relativeDistance > 100) {
                relativeDistance = 100;
              }
            } else {
              if (relativeDistance < 0) {
                relativeDistance = 0;
              }
              if (relativeDistance > 100) {
                relativeDistance = 100;
              }
            }

            data[0].push([xval, eachEntry.angle]);
            data[1].push([xval, relativeDistance]);
          }
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
              shared: true,
              formatter: function () {
                return tooltipFormaterFunction(this, "number", null);
              },
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
                tickColor: "orange",
                tickWidth: 2,
                lineWidth: 2,
                lineColor: "orange",
                minPadding: 0.2,
                maxPadding: 0.2,
                gridLineWidth: 2,
                tickColor: "orange",
                gridLineColor: "gray",
                title: {
                  text: $scope.chartLabel[0],
                },
                labels: {
                  style: {
                    fontSize: "13px",
                    color: "orange",
                  },
                },
              },
              {
                tickColor: "red",
                tickWidth: 2,
                lineWidth: 2,
                lineColor: "red",
                minPadding: 0.2,
                maxPadding: 0.2,
                gridLineWidth: 2,
                tickColor: "red",
                gridLineColor: "gray",
                title: {
                  text: $scope.chartLabel[1],
                },
                labels: {
                  style: {
                    fontSize: "13px",
                    color: "red",
                  },
                },
              },
            ],
            xAxis: {
              minPadding: 0,
              maxPadding: 0,
              type: "datetime",
              tickPixelInterval: 100,
              gridLineWidth: 2,
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
              data: data[0],
              name: $scope.chartLabel[0],
              color: "orange",
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
              data: data[1],
              name: $scope.chartLabel[1],
              color: "red",
              id: "Two",
              tooltip: {},
            },
          ],
          title: {
            text: "",
          },
        };
        $scope.meterChartConfig.options.lang.noData = "No Data Recorded.";
        for (let i = 0; i < $scope.chartLabel.length; i++) {
          $scope.meterChartConfig.series[i].data = data[i];
        }
      };

      $scope.relativedistance = {
        options: {
          chart: {
            type: 'column',
            height: 230
          },
          yAxis: {
            min: 0,
            max: 100,
            labels: {
              formatter: function (v) {
                return v.value + "%";
              }
            },
            title: {
              text: ''
            }
          },
          xAxis: {
            labels: {
              enabled: false
            },
            title: {
              text: ''
            }
          },
          tooltip: {
            formatter: function () {
              return formatRDToolTip(this);
            }
          },
          plotOptions: {
            column: {
              events: {
                click: function (e) {
                  columnRDClick(e);
                }
              }
            }
          },
          legend: {
            enabled: false,
          }
        },
        series: [
          {
            name: "test",
            data: [],
            groupPadding: 0,
            pointPadding: 0,
            minPointLength: 3
          }
        ],
        title: {
          text: ""
        }
      }

      var currentPage = 1;
      var totalPage = 1;
      var limit = 10;

      $scope.nextPage = function () {
        console.log('nextPage');
        if (totalPage > currentPage) {
          console.log('api');
          currentPage++;
          loadRelativeDistance()
        }
      }

      $scope.previousPage = function () {
        console.log('nextPage');
        if (currentPage > 1) {
          console.log('api');
          currentPage--;
          loadRelativeDistance();
        }
      }

      function loadRelativeDistance() {

        const date = localStorage.getItem('singleDate');
        $scope.isLoading = true;
        $http.get(apiBaseUrl + "tracnet-chart?page=" + currentPage + "&limit=" + limit, { headers: customeHeader }).then(function (res) {
          var rowsData = Object.values(res.data.data);
          if (limit <= rowsData.length) {
            totalPage++;
          }

          var allSeriesData = [];
          for (var i = 0; i < rowsData.length; i++) {
            if (1 * rowsData[i]?.val_full >= 0) allSeriesData.push({ y: rowsData[i]?.val_full, myData: rowsData[i], color: "#3255A2" });
          }

          allSeriesData.sort((a, b) => b.y - a.y);

          $scope.relativedistance.series[0].data = allSeriesData;
          if ($scope.$parent && $scope.$parent.relativedistance) {
            $scope.$parent.relativedistance.series[0].data = allSeriesData;
          }

          const relativedistancechart = $('#relativedistance').highcharts();
          relativedistancechart.series[0].update({ data: allSeriesData });

        }).catch(function (error) {
          if (error.status == 401) {
            $window.localStorage.removeItem('authToken');
            $rootScope.storage.loggedIn = false;
            $rootScope.storage.authToken = false;
            $rootScope.storage.$reset();
            $scope.refreshPage();
            $state.go('login');
          }
        }).finally(function () {
          $scope.isLoading = false;
        });


      }



      function formatRDToolTip(pointClicked) {

        const data = pointClicked.point.myData;
        const x = pointClicked.x;
        return (
          data.aTreeNode_textLabel +
          ", " +
          data.street +
          ", " +
          data.val_full +
          "%"
        );
      }

      function columnRDClick(event) {
        const myData = event.point.myData;
        var bounds = new google.maps.LatLng(myData.latitude, myData.longitude);
        tracknetMap.gMap.setCenter(bounds);
        tracknetMap.gMap.setZoom(finalZoomLevel);
      }

      $scope.weatherData = function () {
        Data.getRequest().then((response) => {
          $scope.res = response.data;
          $scope.dynamicCity = ($scope.res.location) ? $scope.res.location.name : '';
          $scope.dynamicState = ($scope.res.location) ? $scope.res.location.state : '';
          $scope.temperature =
            $scope.res.observational.observations.temperature.temperature;
          $scope.humidity =
            $scope.res.observational.observations.humidity.percentage;
          $scope.windSpeed = $scope.res.observational.observations.wind.speed;
          $scope.windDirectionText =
            $scope.res.observational.observations.wind.directionText;
          $scope.Rainfall =
            $scope.res.observational.observations.rainfall.lastHourAmount;
        });
      };
      $scope.weatherData();
      $interval($scope.weatherData, 600000);

      function showMarker(info) {

        var position = info.marker.getPosition();
        info.marker.setMap(null);

        const marker = new google.maps.Marker({
          map: tracknetMap.gMap,
          position: position,
          title: info.installationName,
          id: info.serialNumber,
          disableDefaultUI: true,
          icon: {
            url: info.marker.icon.url,
          },
        });

        //var ttemp = info.ts.slice(0, info.ts.indexOf("+"));
        const inputDateString = info.ts;
        const ttemp = convertDateStringToISOString(inputDateString);
        const singaporeTime = moment(ttemp).tz("Asia/Singapore");
        var timee = singaporeTime.format("h:mm:ss A");
        var datee = singaporeTime.format("ddd, MMMM Do YYYY");


        var distanceHeight = parseInt(info.distanceValue);
        if (distanceHeight > 3998) {
          distanceHeight = "";
        }
        if (distanceHeight < 400) {
          distanceHeight = 400;
        }


        if (info.totalAlerts != undefined) {

          var relativeDistanceCal = Math.round((((info.empty - info.full) - (info.distanceValue - info.full)) / (info.empty - info.full)) * 100)
          if (relativeDistanceCal < 0) {
            relativeDistanceCal = 0;
          }
          if (relativeDistanceCal > 100) {
            relativeDistanceCal = 100;
          }
        } else {

          var relativeDistanceCal = Math.round((((3998 - 400) - (info.distanceValue - 400)) / (3998 - 400)) * 100)
          if (relativeDistanceCal < 0) {
            console.log(info.distanceValue, info, "height");
            relativeDistanceCal = 0;
          }
          if (relativeDistanceCal > 100) {
            relativeDistanceCal = 100;
          }

        }

        if (
          (info.location == "undefined") |
          (info.location == "undefined undefined")
        )
          info.installationLocation = "Custom Location";
        else info.installationLocation = info.location;

        if (info.city == "undefined") info.installationCity = "Custom City";
        else info.installationCity = info.city;

        if (info.area == "undefined" || info.area == "")
          info.area = "Custom Area";
        else info.area = info.area;

        var distance_value = "";
        if (info.distance > 400) distance_value = info.distance;
        else if (info.distance > 3998) {
          distance_value = "";
        } else {
          distance_value = 400;
        }

        marker.content =
          '<div class="infoWindowContent">' +
          "<b>Last Data: </b>" +
          datee +
          " " +
          timee +
          "<br>" + //IS-384 rename label name suggested by client
          "<b>Street: </b>" +
          info.area +
          "<br>" +
          "<b>City: </b>" +
          info.installationCity +
          "<br>" +
          "<b>Distance: </b>" +
          distance_value.toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          " mm<br>" +
          "<b>Relative Distance: </b>" + relativeDistanceCal + ' %<br>' +
          "<b>Angle: </b>" +
          info.angle +
          " deg<br>" +
          "<b>Temperature: </b>" +
          info.temperature +
          " °C<br>" +
          "<b>Signal Strength: </b>" +
          Math.trunc(info.signalStrength).toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          " dBm<br>" +
          "<b>Battery Status: </b>" +
          info.batteryVolt +
          " V<br>" +
          "</div>";

        /**IS-416 starts*/
        var streetCityName = info.area + ", " + info.installationCity;

        /*IS-416 ends*/
        marker.sensorContent =
          '<div class="history_block" >' +
          '<div class="history_block" >' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i>' +
          info.installationName +
          "<br>" +
          streetCityName +
          ' <span class="data-date"></span> </li>' + //IS-416
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Last Communication Timestamp:</span> ' +
          datee +
          " " +
          timee +
          '</span> <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Relative Distance: </span>' + relativeDistanceCal + ' % <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Distance:</span> ' +

          distance_value.toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          ' mm <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Angle: </span>' +
          info.angle +
          ' deg <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Temprature: </span>' +
          info.temperature +
          ' °C<span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Battery Voltage:</span> ' +
          info.batteryVolt +
          ' V <span class="data-date"></span> </li>' +
          '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Signal Strength:</span> ' +
          Math.trunc(info.signalStrength).toLocaleString(undefined, {
            maximumFractionDigits: info.decimalPlaces,
          }) +
          ' dBm <span class="data-date"></span> </li>' +
          "</div>";
        ("</div>");

        marker.addListener("click", function () {
          let markers = tracknetMap.marker;

          for (var i = markers.length - 1; i >= 0; i--) {
            if (markers[i].id == marker.id) {
              tracknetMap.infoWindow.setContent(
                "<h2>" +
                $scope.locationData[marker.id].installationName +
                "</h2>" +
                markers[i].content
              );
              $scope.locationData[marker.id].marker = markers[i];
              break;
            }
          }

          tracknetMap.infoWindow.open(map, marker);
          $scope.$emit("serialNumber", marker.id);
        });

        tracknetMap.marker.push(marker);
        return marker;
      }
    }
  );

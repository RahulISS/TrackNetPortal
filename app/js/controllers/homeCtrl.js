angular
  .module("homeCtrl", [])

  .controller(
    "homeController",
    function ($scope, $http, $rootScope, Data, $timeout, $compile, $interval) {
      /*TraNet yvw mobile portal*/

      $scope.refreshPage = function () {
        setTimeout(function () {
          window.location.reload();
        }, 50);
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

      /*showing all markers*/
      var arr = [];
      function addMarker() {
        $scope.isLoading = true;
        const query = $http
          .get("https://dev-api-sg.tracwater.asia/api/v1/newtraknetApiList")
          .then(function (res) {
            const response = res.data.data;

            var convertedData = [];

            for (var i = response.length - 1; i > 0; i--) {
              var data = response[i];

              if (data.point.angle > 5) {
                var angleColorRank = 1;
                var angleColor = "Red";
                var angle_alarm_tr = "Angle alarm Triggered";
              } else {
                var angleColorRank = 3;
                var angleColor = "Green";
                var angle_alarm_tr = "";
              }

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
                var distance_alarm_tr = "";

                if (data.point.height > 3998) {
                  var dis_color_rank = 0;
                  var dis_color = "";
                }
                if (data.point.height < 300) {
                  var distanceValue = 400;
                  var distance_alarm_tr = "Distance alarm Triggered";
                  var dis_color_rank = 3;
                  var dis_color = "Red";
                }
                if (
                  data.point.height < data.point.distance_alert &&
                  data.point.alert_enable == 1
                ) {
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
                  latitude: parseFloat(data.location.latitude), // Populate with the appropriate value from the response
                  longitude: parseFloat(data.location.longitude), // Populate with the appropriate value from the response
                  city: data.location.city, // Populate with the appropriate value from the response
                  serialNumber: data.product.id_serial, // Populate with the appropriate value from the response
                  installationId: data.point._id.$oid, // Populate with the appropriate value from the response
                  installationName: data.treenode.textLabel, // Populate with the appropriate value from the response
                  angle: data.point.angle,
                  angleColorRank: angleColorRank, // Populate with the appropriate value from the response
                  angleColor: angleColor, // Populate with the appropriate value from the response
                  angle_alarm_tr: angle_alarm_tr, // Populate with the appropriate value from the response
                  lastCommColorRank: lastCommColor,
                  lastComm_alarm_tr: lastComm,
                  last_communication: 9,
                  manhole_level_alarm: manhole_level_alarm,
                  manhole_moved_alarm: manhole_moved_alarm,
                  status: "all clear",
                  color: "green",
                  oldest_comm_date: timeDate,
                  customDistance: 500,
                  area: data.location.street, // Populate with the appropriate value from the response
                  // batterySta: data.location.street, // Populate with the appropriate value from the response
                  batteryStatus: data.point.manholeBatteryStatusValue,
                  batteryVolt: data.point.battery_voltage, // Populate with the appropriate value from the response
                  //dis: data.point.distanceValue, // Populate with the appropriate value from the response
                  distance: distanceValue,
                  disColorRank: dis_color_rank, // Populate with the appropriate value from the response
                  disColor: dis_color, // Populate with the appropriate value from the response
                  distance_alarm_tr: distance_alarm_tr, // Populate with the appropriate value from the response
                  distanceValue: distanceValue,
                  //levelAl: '', // Populate with the appropriate value from the response
                  levelAlarm: data.point.manholeLevelAlarmValue,
                  //movedAl: '', // Populate with the appropriate value from the response
                  movedAlarm: data.point.moved_alarm,
                  //signalStre: '', // Populate with the appropriate value from the response
                  signalStrength: data.point.signal_strength,
                  //temp: '', // Populate with the appropriate value from the response
                  temperature: data.point.temperature,
                  ts: data.ts, //timeDate + " hours ago"
                };

                convertedData.push(convertedPoint);
              }
            }

            const aLocation = convertedData;
            $scope.dataLocation = aLocation;

            const sorter = (a, b) => {
              return b.disColorRank - a.disColorRank;
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
              if (
                $scope.dataLocation[i].disColorRank == 1 &&
                $scope.dataLocation[i].angleColorRank == 1
              ) {
                arrRed__1_1.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 1 &&
                $scope.dataLocation[i].angleColorRank == 2
              ) {
                arrRed__1_2.push($scope.dataLocation[i]);
              }
              if (
                $scope.dataLocation[i].disColorRank == 2 &&
                $scope.dataLocation[i].angleColorRank == 1
              ) {
                arrRed__2_1.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 1 &&
                $scope.dataLocation[i].angleColorRank == 3
              ) {
                arrRed__1_3.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 3 &&
                $scope.dataLocation[i].angleColorRank == 1
              ) {
                arrRed__3_1.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 2 &&
                $scope.dataLocation[i].angleColorRank == 2
              ) {
                arrYellow_2_2.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 2 &&
                $scope.dataLocation[i].angleColorRank == 3
              ) {
                arrYellow_2_3.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 3 &&
                $scope.dataLocation[i].angleColorRank == 2
              ) {
                arrYellow_3_2.push($scope.dataLocation[i]);
              }

              if (
                $scope.dataLocation[i].disColorRank == 3 &&
                $scope.dataLocation[i].angleColorRank == 3
              ) {
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

            $scope.sortedArray_1 = $scope.sortedArray;

            // sorted end
            for (var i = 0; i < $scope.sortedArray.length; i++) {
              arr.push(aLocation[i].installationId.split(" ")[0]);

              let dict = {};
              dict["id"] = aLocation[i].installationId.split(" ")[0];
              dict["latitude"] = aLocation[i].latitude;
              dict["longitude"] = aLocation[i].longitude;
              dict["distance"] = aLocation[i].distance;
              dict["angle"] = aLocation[i].angle;
              dict["status"] = aLocation[i].status;
              dict["address"] = aLocation[i].address;
              dict["installationName"] = aLocation[i].installationName;
              dict["city"] = aLocation[i].city;
              dict["infoBox"] = null;
              dict["serial_no"] = aLocation[i].product_serialNumber;
              dict["colorRank"] = aLocation[i].disColorRank;
              dict["colorRank2"] = aLocation[i].angleColorRank;
              let marker = buildMarker(dict);
              dict["marker"] = marker;
              dict["point"] = marker.point;
              $scope.displayData.push(dict);
            }
          })
          .finally(function () {
            $scope.isLoading = false;
          });
      }

      let beachMarker = [];

      function buildMarker(dict) {
        if (
          typeof dict.latitude === "undefined" &&
          typeof dict.longitude === "undefined"
        )
          return;
        var disctdis = dict.distance < 3998 ? dict.distance + " mm" : "--";
        var infowindow = new google.maps.InfoWindow({
          content: disctdis.toLocaleString() + ",  " + dict.angle + "\xBA",
        });

        var colorCode = dict.colorRank;
        var colorCode2 = dict.colorRank2;
        var imgpath = "";
        if (colorCode) {
          if (colorCode == 3 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
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

      function getInfoWinData(node, marker) {
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
        localStorage.setItem("node_id", nodeID.split(" ")[0]);
        const query = $http
          .get(
            "https://dev-api-sg.tracwater.asia/api/v1/html_aTreeNode_hisEndVal?aTreeNodeId=" +
              nodeID
          )
          .then(function (response) {
            const readings = response.data.data;

            let content = document.createElement("div");
            content.style.cssText =
              "text-align: center; background: black; color: white; padding: 5px; font-size: 1.8rem";
            content.setAttribute("id", "infoBox_" + nodeID.split(" ")[0]);
            let tempInnerHTML =
              "<b>" +
              node.installationName +
              "</b><table class='homemaptable'>";
            for (let i = 0; i < readings.length; i++) {
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
              "<tr style='background: #ececec;'><td colspan='2'><div style='display: inline-flex;gap: 10px; padding: 0px;'><p  style='height:50px;width:131px;padding: 24px; color: black;border-bottom: 2px solid;margin: 0; cursor: pointer;'> Site Setting</p>";
            tempInnerHTML =
              tempInnerHTML +
              "<tr style='background: #ececec;'><td colspan='2'><div style='display: inline-flex;gap: 10px; padding: 5px 0 10px;'><img ng-click='poppupForm()' src='https://www.iconpacks.net/icons/2/free-settings-icon-3110-thumb.png'/ style='height:50px;width:50px;padding: 10px; background: white;border-radius: 5px;margin: 0; cursor: pointer;'>";
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
      }

      /*open the poppup form click on setting icon in info window*/
      $scope.poppupForm = function () {
        var node_id = localStorage.getItem("node_id");
        $("#popupModalCenter").addClass("show-modal");
        $http
          .get(
            "https://dev-api-sg.tracwater.asia/api/v1/user-definded-distancealert?aTreeNodeRef=" +
              node_id
          )
          .then(function (response) {
            $scope.pointSettingData = response.data.data;
            localStorage.setItem(
              "instName",
              $scope.pointSettingData.installationName
            );
          });
      };

      /*save the settings poppup form data*/
      $scope.SavePoppupFormData = function () {
        var node_name = localStorage.getItem("node_name");
        let instName = localStorage.getItem("instName");
        var node_id = localStorage.getItem("node_id");
        $scope.bench_height = angular.element($("#bench_height")).val();
        $scope.angel_alarm = angular.element($("#angel_alarm")).val();
        var distance = angular.element($("#distance_alarm")).val() || 0;
        $scope.distance_alarm = distance;
        $scope.serialNo = angular.element($("#serialNumber")).val();
        $scope.checkVal = angular.element($("#enableDistanceAlarm")).val();
        if ($scope.checkVal == "") $scope.checkVal = 0;
        else $scope.checkVal = angular.element($("#enableDistanceAlarm")).val();
        let formData = {
          aTreeNodeRef: node_id,
          alert_enable: $scope.checkVal,
          distance_alert: $scope.distance_alarm,
        };
        $http
          .post(
            "https://dev-api-sg.tracwater.asia/api/v1/add-user-definded-distancealert",
            formData
          )
          .then(function (response) {
            if (response.data.status) {
              alert("Data Saved");
              $("#popupModalCenter").removeClass("show-modal");
            } else if (data.status == 400) {
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
        if (
          typeof dict.latitude === "undefined" &&
          typeof dict.longitude === "undefined"
        )
          return;
        var infowindow = new google.maps.InfoWindow({
          content:
            dict.distance.toLocaleString() +
            "mm " +
            " ,  " +
            dict.angle +
            "\xBA",
        });
        var colorCode = dict.disColorRank;
        var colorCode2 = dict.angleColorRank;
        var imgpath = "";
        if (colorCode) {
          if (colorCode == 3 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 1 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 1) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          }
          if (colorCode == 2 && colorCode2 == 3) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
          }
          if (colorCode == 3 && colorCode2 == 2) {
            var imgpath =
              "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
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
    }
  );

angular
  .module("tracknetCtrl", [])
  .controller(
    "tracknetController",
    function (
      $scope,
      $rootScope,
      $http,
      Data,
      $q,
      $timeout,
      $interval,
      $filter
    ) {
      const portalRef = "64ad1af2664396439a286273"; //tracnet trial 20230703
      const dataPickerFormat = "D/MM/YYYY";
      const skySparkFormat = "YYYY-MM-DD";
      $scope.isFirstLoad = true;
      $scope.clockTime = function () {
        $scope.time = moment().utcOffset("+08:00").format("h:mm:ss a");
        $scope.date = moment().utcOffset("+08:00").format("ddd, MMM Do YYYY");
      };

      $scope.clockTime();
      $interval($scope.clockTime, 1000);
      $scope.blockExpandLeft = false;
      $scope.blockExpandRight = false;

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
      $scope.chartLabel = ["Angle", "Distance"];

      $scope.$watch("singleDate", function (newDate, oldDate) {
        if (newDate == undefined) return;
        $("#singleDate span").html(moment(newDate).format(dataPickerFormat));
        $scope.loadData(true);
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
      $scope.locationData = {};
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

      $scope.loadData = function (initset) {
        $scope.device = {};
        /** IS-384 - change old api tracNet_getAllInstallations_02_a with new tracNet_getAllInstallations_03_a https://dev-api-sg.tracwater.asia/api/v1/ */
        // Define the API URL based on the isFirstLoad flag
        const apiUrl = $scope.isFirstLoad
        ? "https://dev-api-sg.tracwater.asia/api/v1/newtraknetApiList"
        : "https://dev-api-sg.tracwater.asia/api/v1/newtraknetApiList/" + localStorage.getItem("singleDate");

        
        $http
          .get(apiUrl)
          .then(function (res) {
            const response = res.data.data;
            var convertedData = [];

            for (var i = 0; i < response.length; i++) {
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

              var distanceValue = parseInt(data.point.height);
              var dis_color_rank = 3;
              var dis_color = "Green";
              var distance_alarm_tr = "";

              if (data.point.height > 3998) {
                var dis_color_rank = 3;
                var dis_color = "Green";
              }
              if (data.point.height < 300) {
                var distanceValue = 400;
                var distance_alarm_tr = "Distance alarm Triggered";
                var dis_color_rank = 1;
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

              if (data.point.date) {
                var timeDate = data.point.date;
              }
              var angleValue = parseInt(data.point.angle);

              var convertedPoint = {
                installationName: data.treenode.textLabel,
                locationID: data.location._id.$oid,
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
                installationId: data.treenode._id.$oid, // Populate with the appropriate value from the response
                // installationName: data.treenode.textLabel, // Populate with the appropriate value from the response

                angle: angleValue,
                angleColorRank: angleColorRank, // Populate with the appropriate value from the response
                angleColor: angleColor, // Populate with the appropriate value from the response
                angle_alarm_tr: angle_alarm_tr, // Populate with the appropriate value from the response

                lastCommColorRank: 0,
                lastComm_alarm_tr: "",
                last_communication: 9,
                manhole_level_alarm: manhole_level_alarm,
                manhole_moved_alarm: manhole_moved_alarm,
                status: "all clear",
                color: "green",
                oldest_comm_date: "2 days ago",
                customDistance: 500,
                area: data.location.street, // Populate with the appropriate value from the response
                // batterySta: data.location.street, // Populate with the appropriate value from the response
                batteryStatus: data.point.battery_status,
                batteryVolt: data.point.battery_voltage, // Populate with the appropriate value from the response
                //dis: data.point.distanceValue, // Populate with the appropriate value from the response
                distance: distanceValue,
                disColorRank: dis_color_rank, // Populate with the appropriate value from the response
                disColor: dis_color, // Populate with the appropriate value from the response
                distance_alarm_tr: distance_alarm_tr, // Populate with the appropriate value from the response
                distanceValue: distanceValue,
                //levelAl: '', // Populate with the appropriate value from the response
                levelAlarm: data.point.manholeLevelAlarm,
                //movedAl: '', // Populate with the appropriate value from the response
                movedAlarm: data.point.manholeMovedAlarm,
                //signalStre: '', // Populate with the appropriate value from the response
                signalStrength: data.point.signal_strength,
                //temp: '', // Populate with the appropriate value from the response
                temperature: data.point.temperature,
                ts: timeDate,
                realts: data.point.created_at,

                data: {
                  city: data.location.city,
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  state: data.location.state,
                  street: data.location.street,
                  tz: data.location.tz,
                },
              };

              convertedData.push(convertedPoint);
            }

            for (i = 0; i < convertedData.length; i++) {
              if ($scope.device[convertedData[i].serialNumber] == undefined)
                $scope.device[convertedData[i].serialNumber] = [];
              let eachData = convertedData[i];
              $scope.device[convertedData[i].serialNumber].push(eachData);
            }
            let queriesArray = [];

            var i = 0;
            for (var index in $scope.device) {
              i++;
             
              //setTimeout(() => {
              if ($scope.device[index].length) {
                if(convertedData[i]) {
                  queriesArray.push({
                    index: index,
                    query: convertedData[i].data,
                  });
                }
                i++;
              }
              //}, 1000000);
            }

            if (queriesArray.length > 0) {
              let promises_data = queriesArray.map(function (item) {
                return {
                  idx: item.index,
                  data: item.query,
                };
              });

              $q.all(promises_data).then(function (responses) {
                if (responses.length !== queriesArray.length) return;
                for (let j = 0; j < responses.length; j++) {
                  if (initset && !isIwOpen() && j == 0) {
                    $scope.serialNo = responses[j].idx;
                  }

                  $scope.locationData[responses[j].idx] =
                    $scope.device[responses[j].idx][
                      $scope.device[responses[j].idx].length - 1
                    ];
                  $scope.locationData[responses[j].idx].position =
                    responses[j].data[0];
                  $scope.locationData[responses[j].idx].marker = createMarker(
                    $scope.locationData[responses[j].idx]
                  );
                }

                if (document.getElementById("myDiv"))
                  document.getElementById("myDiv").innerHTML =
                    $scope.locationData[$scope.serialNo].marker.sensorContent;
                $scope.updateChartConfig();
                if (initset && !(tracknetMap.isZoomed || isIwOpen()))
                  $scope.recenterMap(false);
                if ($scope.serialNo != "")
                  updateOpenedInfowidow(
                    $scope.locationData[$scope.serialNo].marker
                  );
              });
            }
          }).finally(function () {
            // After the API call, set isFirstLoad to false, so subsequent calendar changes use the new URL
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

      function getMarkerColor(info) {
        if (info.disColorRank == 3 && info.angleColorRank == 3)
          return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        if (info.disColorRank == 3 && info.angleColorRank == 1)
          return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 3)
          return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 1)
          return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 2)
          return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 1)
          return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 2)
          return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 3)
          return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        if (info.disColorRank == 3 && info.angleColorRank == 2)
          return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
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
        const markericon = getMarkerColor(info);
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
       
        if (info.distance > 400) 
        {
          distance_value = info.distance;
        }
         else {
          distance_value = 400;
        }
        if (info.distance > 3998){
          distance_value = "";
          
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
                color: "#FFFF00",
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

      $scope.$on("$viewContentLoaded", function () {
        $http
          .get(
            "https://dev-api-sg.tracwater.asia/api/v1/newtraknetApiList"
          )
          .then(function (res) {
            const response = res.data.data;
            var convertedAlertCountData = [];
            for (var i = response.length - 1; i > 0; i--) {
              var data = response[i];
              if ( Number(data.point.angle) > 5) {
                var angleColorRank = 1;
                var angleColor = "Red";
                var angle_alarm_tr = "Angle alarm Triggered";
              } else {
                var angleColorRank = 3;
                var angleColor = "Green";
                var angle_alarm_tr = "";
              }

              var distanceValue = parseInt(data.point.height);

              if ( Number(data.point.height) < 300) {
                var distanceValue = 400;
                var distance_alarm_tr = "Distance alarm Triggered";
                var dis_color_rank = 1;
                var dis_color = "Red";
              } else if ( Number(data.point.height) > 3998) {
                var distanceValue = "";
                var dis_color_rank = "";
                var dis_color = "";
              } else {
                var dis_color_rank = 3;
                var dis_color = "Green";
                var distance_alarm_tr = "";
              }
              
              if ("distance_alert" in data.point) {
                var distanceAlertValue = parseInt(data.point.distance_alert);
                if (Number(data.point.height) < distanceAlertValue && data.point.alert_enable ==  1 ) {
                  dis_color_rank = 2;
                  var dis_color = "Yellow";
                  var distance_alarm_tr = "Distance alert Triggered";
                }
              }

              var convertedAlertCountPoint = {
                angle: data.point.angle,
                angleColorRank: angleColorRank, // Populate with the appropriate value from the response
                angleColor: angleColor, // Populate with the appropriate value from the response
                angle_alarm_tr: angle_alarm_tr, // Populate with the appropriate value from the response
                product_serialNumber: data.point.device_id,
                distance: data.point.distance,
                disColorRank: dis_color_rank, // Populate with the appropriate value from the response
                disColor: dis_color, // Populate with the appropriate value from the response
                distance_alarm_tr: distance_alarm_tr, // Populate with the appropriate value from the response
                distanceValue: data.point.distance,
              };

              convertedAlertCountData.push(convertedAlertCountPoint);
            }
            var uniqueDataCount = [];
            var deviceIds = new Set(); // Using a Set to store unique device_ids

            for (var i = 0; i < convertedAlertCountData.length; i++) {
              var data = convertedAlertCountData[i];
              if (!deviceIds.has(data.product_serialNumber)) {
                uniqueDataCount.push(data);
                deviceIds.add(data.product_serialNumber);
              }
            }

            for (var i = 0; i < uniqueDataCount.length; i++) {
              if ( uniqueDataCount[i].angleColorRank == 3 && uniqueDataCount[i].disColorRank == 3 )
                $scope.realtimesummery.series[0].data[0].y++;
              if ( uniqueDataCount[i].disColorRank == 2) $scope.realtimesummery.series[0].data[1].y++
              if ( uniqueDataCount[i].disColorRank == 1 || uniqueDataCount[i].angleColorRank == 1 )
                $scope.realtimesummery.series[0].data[2].y++;
            }
          });

        $http
          .get(
            "https://dev-api-sg.tracwater.asia/api/v1/tracnet-alarm-alert-tab"
          )
          .then(function (res) {
            const response = res.data.data;
            var convertedData = [];

            for (var i = response.length - 1; i > 0; i--) {
              var data = response[i];
              if (data.location !== "") {
                var status = "";
                var disValue = "";
                if (Number(data.height) < 300) {
                  status = "Distance alarms triggered";
                } else if (Number(data.angle) > 5) {
                  status = "Angle alarms triggered";
                } else if (
                  Number(data.height) < 300 &&
                  Number(data.angle) > 5
                ) {
                  status = "all alarms triggered";
                } else {
                  status = "all clear";
                }

                if ("distance_alert" in data) {
                    var distanceAlertValue = parseInt(data.distance_alert);
                    if (Number(data.height) < distanceAlertValue && data.alert_enable ==  1 ) {
                      status = "Distance alert triggered";
                    }
                }
                
                if (Number(data.height) < 400) {
                  var disValue = 400;
                } else if (Number(data.height) >= 3998) {
                  var disValue = "";
                } else {
                  var disValue = Number(data.height);
                }

                if (parseInt(data.created_at.$date.$numberLong))
               
                var currentDate = new Date();
                const singaporeCurrentTime = moment(currentDate).tz("Asia/Singapore");
                const ttemp = convertDateStringToISOString(data.date);
                const singaporeTime = moment(ttemp).tz("Asia/Singapore");
                var timeDiff = Math.abs(singaporeCurrentTime - singaporeTime);
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
                  var hours = Math.floor(tismeDiff / (1000 * 60 * 60)) + "y";
                }

                var timeDate = hours;

                var msg = "";
                if (disValue != "") {
                  var msg =
                    "Distance: " +
                    disValue +
                    " mm, Angle: " +
                    data.angle +
                    " deg";
                } else {
                  var msg = "Angle: " + data.angle + " deg";
                }
                var convertedPoint = {
                  aTreeNodeRef: data._id.$oid,
                  aTreeNode_textLabel: data.textLabel,
                  latitude: parseFloat(data.location.latitude),
                  longitude: parseFloat(data.location.longitude),
                  message: msg,
                  oldest_comm_date: data.date + " hours",
                  product_serialNumber: data.device_id,
                  status: status,
                  oldest_comm_date: timeDate,
                  last_comm_split: timeDate + " hours ago",
                  street: data.location.street,
                  city: data.location.city,
                  time: timeDate + " hours ago",
                };

                convertedData.push(convertedPoint);
              }
            }
            var uniqueData = [];
            var deviceIds = new Set(); // Using a Set to store unique device_ids

            for (var i = 0; i < convertedData.length; i++) {
              var data = convertedData[i];
              if (!deviceIds.has(data.product_serialNumber)) {
                uniqueData.push(data);
                deviceIds.add(data.product_serialNumber);
              }
            }

            $scope.alertLists = uniqueData;
            var uniqueAlertData = [];
            
            for (var i = 0; i < $scope.alertLists.length; i++) {
              $scope.alertLists[i].class = "";
              if ($scope.alertLists[i].status == "Distance alarms triggered") {
                uniqueAlertData.push($scope.alertLists[i]);

                $scope.alertLists[i].class = "distance danger";
              }
              if ($scope.alertLists[i].status == "Angle alarms triggered") {
                uniqueAlertData.push($scope.alertLists[i]);

                $scope.alertLists[i].class = "distance danger";
              }
              if ($scope.alertLists[i].status == "Distance alert triggered") {
                uniqueAlertData.push($scope.alertLists[i]);

                $scope.alertLists[i].class = "distance warn";
              }
              if ($scope.alertLists[i].status == "all alarms triggered") {
                uniqueAlertData.push($scope.alertLists[i]);

                $scope.alertLists[i].class = "distance danger";
              }

              last_comm_split =
                $scope.alertLists[i].oldest_comm_date.split(" ");

              if (
                last_comm_split[1] == "minutes" ||
                last_comm_split[1] == "minute"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "min";
              } else if (
                last_comm_split[1] == "hours" ||
                last_comm_split[1] == "hour"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "h";
              } else if (
                last_comm_split[1] == "day" ||
                last_comm_split[1] == "days"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "d";
              } else if (
                last_comm_split[1] == "weeks" ||
                last_comm_split[1] == "week"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "wk";
              } else if (
                last_comm_split[1] == "month" ||
                last_comm_split[1] == "months"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "mo";
              } else if (
                last_comm_split[1] == "year" ||
                last_comm_split[1] == "year"
              ) {
                $scope.alertLists[i].oldest_comm_date =
                  last_comm_split[0] + "y";
              }
              // else {
              //     $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "y";
              // }
            }
            $scope.alertCount = uniqueAlertData.length;
            $scope.alertLists = uniqueAlertData;
          });
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
            data[0].push([xval, eachEntry.angle]);
            data[1].push([xval, eachEntry.distance]);
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
          $scope.dynamicCity = $scope.res.location.name;
          $scope.dynamicState = $scope.res.location.state;
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

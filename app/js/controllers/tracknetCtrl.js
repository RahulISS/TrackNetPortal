angular.module('tracknetCtrl', []).controller('tracknetController', function ($scope, $rootScope, $http, Data, $q, $timeout, $interval) {
    const portalRef = '64ad1af2664396439a286273'; //tracnet trial 20230703
    const dataPickerFormat = "D/MM/YYYY";
    const skySparkFormat = "YYYY-MM-DD";
    $scope.clockTime = function () {
        $scope.time = moment().utcOffset("+08:00").format("h:mm:ss a");
        $scope.date = moment().utcOffset("+08:00").format("ddd, MMM Do YYYY");
    }
    $scope.clockTime();
    $interval($scope.clockTime, 1000);
    $scope.blockExpandLeft = false;
    $scope.blockExpandRight = false;

    $('#singleDate').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        minYear: 2020,
        startDate: moment()
    }, function (start) {
        $scope.singleDate = start.format(skySparkFormat);
        localStorage.setItem('singleDate', $scope.singleDate);
    });

    const initZoomLevel = 11; //IS-384
    const finalZoomLevel = 20;
    let tracknetMap = document.getElementById('tracknetMap');
    /**IS-404 starts - custom style for removing all unwanted markers from map*/
    let styles = [
        {
            "featureType": "administrative.locality",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "administrative.locality",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "administrative.neighborhood",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.attraction",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.business",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.government",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.medical",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.place_of_worship",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.school",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.sports_complex",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        }
    ];
    /**IS-404 ends*/
    const map = new google.maps.Map(tracknetMap, {
        //zoom: initZoomLevel,//IS-384 //IS-394 remove setZoom as no need when map is seting as per marker points
        center: new google.maps.LatLng(-28.033546, 153.381246),//IS-384
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        fullscreenControl: false,
        styles: styles
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
                $('#exitStreetView').show();
            } else {
                $('#exitStreetView').hide();
            }
        });
    }
    $scope.chartLabel = ['Angle', 'Distance'];

    $scope.$watch("singleDate", function (newDate, oldDate) {
        if (newDate == undefined) return;
        $('#singleDate span').html(moment(newDate).format(dataPickerFormat));
        $scope.loadData(true);
    });
    $scope.nextPrevClick = function (direction) {
        let start = localStorage.getItem('singleDate');
        if (direction == 'left') {
            start = moment(start).subtract(1, "day");
        } else {
            start = moment(start).add(1, "day");
        }
        $('#singleDate').data('daterangepicker').setStartDate(start);
        $('#singleDate').data('daterangepicker').setEndDate(start);
        $scope.singleDate = start.format(skySparkFormat);
        localStorage.setItem('singleDate', $scope.singleDate);
    }
    $scope.singleDate = moment().format(skySparkFormat);
    localStorage.setItem('singleDate', $scope.singleDate);
    // $('#singleDate span').html(moment().format(dataPickerFormat));

    $scope.device = {};
    $scope.locationData = {};
    $scope.serialNo = '';
    $scope.$on("serialNumber", function (e, serialNumber) {
        $scope.serialNo = serialNumber;
    });
    $scope.$watch("serialNo", function (index) {
        if (index == undefined) return;
        if ($scope.locationData[index] == undefined) {
            document.getElementById('myDiv').innerHTML = '';
        } else {
            document.getElementById('myDiv').innerHTML = $scope.locationData[index].marker.sensorContent;
        }
    });
    $scope.loadData = function (initset) {
        $scope.device = {};
        /** IS-384 - change old api tracNet_getAllInstallations_02_a with new tracNet_getAllInstallations_03_a http://54.254.34.0/api/v1/ */
        $http.get('http://54.254.34.0/api/v1/newtraknetApiList/'+ localStorage.getItem('singleDate'))
				.then(function (response){
            const data = response.data.data;
            console.log(data,'sorb data')
            for (i = 0; i < data.length; i++) {
                if ($scope.device[data[i].product_serialNumber] == undefined) $scope.device[data[i].product_serialNumber] = [];
                let eachData = data[i];
                $scope.device[data[i].product_serialNumber].push(eachData);
            }
            let queriesArray = [];
            for (var index in $scope.device) {
                console.log($scope.device[index][0].location,'$scope.device[index][0].location')
                console.log($scope.device[index],'$scope.device[index]')
                
                if ($scope.device[index].length) queriesArray.push({ 'index': index, 'query': 'http://54.254.34.0/api/v1/alocation-data/'+$scope.device[index][0].locationID });
            }
            
            if (queriesArray.length > 0) {
                
                // let promises_data = queriesArray.map(function (item) {
                //     return Data.sendRequest(item.query, $rootScope.storage.skysparkVersion).then(function (reqResult) {
                //         return {
                //             'idx': item.index,
                //             'data': reqResult.data
                //         };
                //     });
                // });
                let promises_data = queriesArray.map(function (item) {
                    return $http.get(item.query)
                    .then(function (reqResult) {
                        return {
                            'idx': item.index,
                            'data': reqResult.data
                        };
                    });
                });
               
                $q.all(promises_data).then(function (responses) {
                    
                    if (responses.length !== queriesArray.length) return;
                    for (let j = 0; j < responses.length; j++) {
                        if (initset && !isIwOpen() && j == 0) {
                            $scope.serialNo = responses[j].idx;
                        }
                    
                        $scope.locationData[responses[j].idx] = $scope.device[responses[j].idx][$scope.device[responses[j].idx].length-1];
                        $scope.locationData[responses[j].idx].position = responses[j].data.data[0];
                        $scope.locationData[responses[j].idx].marker = createMarker($scope.locationData[responses[j].idx]);
                    }

                    if (document.getElementById('myDiv')) document.getElementById('myDiv').innerHTML = $scope.locationData[$scope.serialNo].marker.sensorContent;
                    $scope.updateChartConfig();
                    if (initset && !(tracknetMap.isZoomed || isIwOpen())) $scope.recenterMap(false);
                    if ($scope.serialNo != '') updateOpenedInfowidow($scope.locationData[$scope.serialNo].marker);
                });
            }
        });
    }

    function updateOpenedInfowidow(marker) {
        if (isIwOpen()) {
            tracknetMap.infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
        }
    }

    function isIwOpen() {
        var getmap = tracknetMap.infoWindow.getMap();
        return (getmap !== null && typeof getmap !== "undefined");
    }

    function getMarkerColor(info) {
        if (info.disColorRank == 3 && info.angleColorRank == 3) return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        if (info.disColorRank == 3 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 3) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 1 && info.angleColorRank == 2) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 1) return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 2) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        if (info.disColorRank == 2 && info.angleColorRank == 3) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        if (info.disColorRank == 3 && info.angleColorRank == 2) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

    }

    function createMarker(info) {
        console.log(info,'info sorb')
        const markericon = getMarkerColor(info);
        var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(info.latitude, info.longitude),//IS-384
            title: info.installationName,//IS-416
            id: info.serialNumber,
            disableDefaultUI: true,
            icon: {
               url: markericon,
            },
        });
        
        var ttemp = info.ts.slice(0, info.ts.indexOf("+"));
        var mmx = moment(ttemp);
        var timee = mmx.format('h:mm:ss A');
        var datee = mmx.format('ddd, MMMM Do YYYY');

        if (info.location == "undefined" | info.location == "undefined undefined")
            info.installationLocation = "Custom Location";
        else
            info.installationLocation = info.location;

        if (info.position.city == "undefined")
            info.installationCity = "Custom City";
        else
            info.installationCity = info.position.city;

        var distance_value = ''; 
        if (info.dis > 400)
           distance_value = info.dis;
        else
           distance_value = 400;

        marker.content = '<div class="infoWindowContent">' +
            "<b>Last Data: </b>" + datee + ' ' + timee + '<br>' + //IS-384 rename label name suggested by client
            "<b>Street: </b>" + info.installationLocation + '<br>' +
            "<b>City: </b>" + info.installationCity + '<br>' +
            "<b>Distance: </b>" + distance_value.toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' mm<br>' +
            "<b>Angle: </b>" + info.ang + ' deg<br>' +
            "<b>Temperature: </b>" + info.temp + ' °C<br>' +
            "<b>Signal Strength: </b>" + Math.trunc(info.signalStre).toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' dBm<br>' +
            "<b>Battery Status: </b>" + info.batteryVolt + ' V<br>' +
            '</div>';

        /**IS-416 starts*/
        var streetCityName = info.installationLocation + ', ' + info.installationCity;
        
        /*IS-416 ends*/
        marker.sensorContent = '<div class="history_block" >' +
            '<div class="history_block" >' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i>' + info.installationName +
            '<br>' + streetCityName + ' <span class="data-date"></span> </li>' + //IS-416
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Last Communication Timestamp:</span> ' + datee + ' ' + timee + '</span> <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Distance:</span> ' +
            distance_value.toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' mm <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Angle: </span>' + info.ang + ' deg <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Temprature: </span>' + info.temp + ' °C<span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Battery Voltage:</span> ' + info.batteryVolt + ' V <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Signal Strength:</span> ' + Math.trunc(info.signalStre).toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' dBm <span class="data-date"></span> </li>' +
            '</div>';
        '</div>';
    
        marker.addListener('click', function () {
            let markers = tracknetMap.marker;
            for (var i = markers.length - 1; i >= 0; i--) {
                if (markers[i].id == this.id) {
                    tracknetMap.infoWindow.setContent('<h2>' + $scope.locationData[this.id].aTreeNode_installation + '</h2>' + markers[i].content);
                    $scope.locationData[this.id].marker = markers[i];
                    
                    break;
                }
            }
            infoWindow.open(map, this);
            $scope.$emit('serialNumber', this.id);
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
                        google.maps.event.trigger(markers[i], 'click');
                    }
                }
            }, 100);
        }
    }

    $scope.zoomMapClick = function () {
        if (tracknetMap.isZoomed) return;
        if (typeof $scope.locationData[$scope.serialNo] != 'undefined') {
            tracknetMap.isZoomed = true;
            tracknetMap.gMap.setZoom(finalZoomLevel);
            tracknetMap.gMap.setCenter($scope.locationData[$scope.serialNo].marker.getPosition());
            $scope.triggerMarkerClick();
        }
    }

    $scope.recenterMap = function () {
        var bounds = new google.maps.LatLngBounds();
        for (var i in $scope.locationData) {
            bounds.extend($scope.locationData[i].marker.getPosition());
        }
        tracknetMap.gMap.fitBounds(bounds);
        tracknetMap.gMap.setCenter(bounds.getCenter());
        //tracknetMap.gMap.setZoom(initZoomLevel);
        $scope.triggerMarkerClick();
    }

    $scope.exitStreetViewMap = function () {
        tracknetMap.gMap.getStreetView().setVisible(false);
    }

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
    }

    $scope.realtimesummery = {
        options: {
            chart: {
                plotBackgroundColor: '#18223e',
                plotBorderWidth: 0,
                plotShadow: false,
                type: 'pie',
                height: 220,
                spacing: [10, 10, 5, 10],
                margin: [0, 0, 0, 0]
            },
            tooltip: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: false,
                    },
                    startAngle: -90,
                    borderWidth: 0,
                    center: ['50%', '33%'],
                    innerSize: '60%',
                    size: 100,
                    showInLegend: true,
                    states: {
                        inactive: {
                            opacity: 0.4
                        }
                    }
                }
            },
            legend: {
                layout: 'vertical',
                labelFormatter: function () {
                    return this.name + ' (' + this.y + ')';
                },
                itemStyle: {
                    color: "#FFFFFF",
                    fontFamily: 'var(--bs-font-sans-serif)',
                    fontWeight: '500'
                },
                itemHoverStyle: {
                    color: "#BCBCBC"
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Real-Time Summary',
            data: [
                {
                    name: 'All Clear',
                    y: 0,
                    color: '#00CC99'
                }, {
                    name: 'Distance Alert',
                    y: 0,
                    color: '#FFFF00'
                }
                , {
                    name: 'Alarms',
                    y: 0,
                    color: '#FF5050'
                }
            ]
        }],
        title: {
            text: "Real-Time Summary",
            margin: 0,
            style: {
                color: "#FFFFFF",
                fontSize: '12px',
                fontFamily: 'var(--bs-font-sans-serif)',
                fontWeight: '500'
            }
        }
    };

    $scope.alertCount = 0;
    $scope.alertLists = [];


    $scope.alertClick = function (alert) {
       
        var bounds = new google.maps.LatLngBounds();
        bounds.extend($scope.locationData[alert.product_serialNumber].marker.getPosition());
        tracknetMap.gMap.fitBounds(bounds);
        tracknetMap.gMap.setCenter(bounds.getCenter());
        tracknetMap.gMap.setZoom(finalZoomLevel);
        tracknetMap.isZoomed = true;
        
        let responses = [{
            'idx' : alert.product_serialNumber,
            'data': $scope.locationData[alert.product_serialNumber]
        }];
        
        const installationDetails = $scope.locationData[responses[0].idx];
        showMarker(installationDetails);
        if (document.getElementById('myDiv')) document.getElementById('myDiv').innerHTML = $scope.locationData[alert.product_serialNumber].marker.sensorContent;
        $scope.updateChartConfig();
        let initset = true;
        tracknetMap.infoWindow.close();
        if (initset && !(tracknetMap.isZoomed || isIwOpen())) $scope.recenterMap(false);
        if (alert.product_serialNumber != '') updateOpenedInfowidow($scope.locationData[alert.product_serialNumber].marker);
        
    };

    var last_comm_split = null;

    $scope.$on('$viewContentLoaded', function () {
        $http.get('http://127.0.0.1:8000/api/v1/newtraknetApiList/'+ localStorage.getItem('singleDate'))
				.then(function (response){
                    console.log(response.data,'response.data traknetApiList')
            for (var i = 0; i < response.data.data.length; i++) {
                if (response.data.data[i].angleColorRank == 3 && response.data.data[i].disColorRank == 3) $scope.realtimesummery.series[0].data[0].y++;
                if (response.data.data[i].disColorRank == 2) $scope.realtimesummery.series[0].data[1].y++;
                if (response.data.data[i].disColorRank == 1 || response.data.data[i].angleColorRank == 1) $scope.realtimesummery.series[0].data[2].y++;
            }
        });

        $http.get('http://54.254.34.0/api/v1/tracnet-alarm-alert-tab')
				.then(function (response){
            $scope.alertLists = response.data.data;
            console.log(response.data,'response.data tracnet-alarm-alert-tab')
            for(var i=0; i<$scope.alertLists.length; i++){
                $scope.alertLists[i].class = '';
                if($scope.alertLists[i].status == 'distance alarm triggered') $scope.alertLists[i].class = 'distance danger';
                if($scope.alertLists[i].status == 'angle alarm triggered') $scope.alertLists[i].class = 'distance danger';
                if($scope.alertLists[i].status == 'distance alert triggered') $scope.alertLists[i].class = 'distance warn';
                if($scope.alertLists[i].status == 'all alarms') $scope.alertLists[i].class = 'distance danger';

                last_comm_split = $scope.alertLists[i].oldest_comm_date.split(" ");

                if(last_comm_split[1] ==  "minutes" || last_comm_split[1] ==  "minute") {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "min";
                    
                }
                else if(last_comm_split[1] ==  "hours" || last_comm_split[1] ==  "hour") {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "h";
                    
                }
                else if(last_comm_split[1] ==  "day" || last_comm_split[1] ==  "days") {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "d";
                    
                }
                else if(last_comm_split[1] ==  "weeks" || last_comm_split[1] ==  "week") {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "wk";
                    
                }
                else if(last_comm_split[1] ==  "month" || last_comm_split[1] ==  "months") {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "mo";
                    
                }
                else {
                    $scope.alertLists[i].oldest_comm_date =  last_comm_split[0] + "y";
                }
            }
            $scope.alertCount = $scope.alertLists.length;
        });
    });

    $scope.meterChartConfig = [];

    $scope.updateChartConfig = function () {
        let data = [
            [], []
        ];
        if ($scope.device[$scope.serialNo] != undefined) {
            for (let j = 0; j < $scope.device[$scope.serialNo].length; j++) {
                let eachEntry = $scope.device[$scope.serialNo][j];
                var ttemp = eachEntry.ts.slice(0, eachEntry.ts.indexOf("+"));
                var mmx = moment.utc(ttemp);
                const xval = mmx.valueOf();
                data[0].push([xval, eachEntry.angle]);
                data[1].push([xval, eachEntry.distance]);
            }
        }

        $scope.meterChartConfig =
        {
            options:
            {
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
                    shared: true,
                    formatter: function () {
                        return tooltipFormaterFunction(this, "number", null);
                    },
                    crosshairs: {
                        color: 'black',
                        dashStyle: 'solid'
                    },
                },
                chart: {
                    type: 'line',
                    zoomType: 'xy',
                },
                plotOptions: {
                    series: {
                        states: {
                            inactive: {
                                opacity: 1
                            }
                        },
                        connectNulls: true
                    }
                },
                yAxis: [{
                    tickColor: 'orange',
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: 'orange',
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: 'orange',
                    gridLineColor: 'gray',
                    title: {
                        text: $scope.chartLabel[0]
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: 'orange'
                        }
                    }
                },
                {
                    tickColor: 'red',
                    tickWidth: 2,
                    lineWidth: 2,
                    lineColor: 'red',
                    minPadding: 0.2,
                    maxPadding: 0.2,
                    gridLineWidth: 2,
                    tickColor: 'red',
                    gridLineColor: 'gray',
                    title: {
                        text: $scope.chartLabel[1]
                    },
                    labels: {
                        style: {
                            fontSize: '13px',
                            color: 'red'
                        }
                    }
                }],
                xAxis: {
                    minPadding: 0,
                    maxPadding: 0,
                    type: 'datetime',
                    tickPixelInterval: 100,
                    gridLineWidth: 2,
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                }
            },
            series: [
                {
                    lineWidth: 3,
                    yAxis: 0,
                    marker: {
                        symbol: 'circle',
                        enabled: false
                    },
                    data: data[0],
                    name: $scope.chartLabel[0],
                    color: 'orange',
                    id: 'One',
                    tooltip: {}
                }, {
                    lineWidth: 3,
                    yAxis: 1,
                    marker: {
                        symbol: 'circle',
                        enabled: false
                    },
                    data: data[1],
                    name: $scope.chartLabel[1],
                    color: 'red',
                    id: 'Two',
                    tooltip: {}
                }],
            title: {
                text: ""
            }
        };
        $scope.meterChartConfig.options.lang.noData = 'No Data Recorded.';
        for (let i = 0; i < $scope.chartLabel.length; i++) {
            $scope.meterChartConfig.series[i].data = data[i];
        }
    }

    function formatRDToolTip(pointClicked) {
        const data = pointClicked.point.myData;
        const x = pointClicked.x;
        return data.aTreeNode_textLabel + ', ' + data.street + ', ' + data.val_full + '%';
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
            $scope.temperature = $scope.res.observational.observations.temperature.temperature;
            $scope.humidity = $scope.res.observational.observations.humidity.percentage;
            $scope.windSpeed = $scope.res.observational.observations.wind.speed;
            $scope.windDirectionText = $scope.res.observational.observations.wind.directionText;
            $scope.Rainfall = $scope.res.observational.observations.rainfall.lastHourAmount;
        });
    }
    $scope.weatherData();
    $interval($scope.weatherData, 600000);

    function showMarker(info){
        var position = info.marker.getPosition();
        info.marker.setMap(null);

        const marker = new google.maps.Marker({
            map: tracknetMap.gMap,
            position: position,
            title: info.aTreeNode_installation,
            id: info.serialNumber,
            disableDefaultUI: true,
            icon: {
               url: info.marker.icon.url,
            },
        });

        var ttemp = info.ts.slice(0, info.ts.indexOf("+"));
        var mmx = moment(ttemp);
        var timee = mmx.format('h:mm:ss A');
        var datee = mmx.format('ddd, MMMM Do YYYY');

        if (info.location == "undefined" | info.location == "undefined undefined")
            info.installationLocation = "Custom Location";
        else
            info.installationLocation = info.location;

        if (info.position.city == "undefined")
            info.installationCity = "Custom City";
        else
            info.installationCity = info.position.city;
        
        var distance_value = '';  
        if (info.dis > 400)
            distance_value = info.dis;
        else
            distance_value = 400;

        marker.content = '<div class="infoWindowContent">' +
            "<b>Last Data: </b>" + datee + ' ' + timee + '<br>' + //IS-384 rename label name suggested by client
            "<b>Street: </b>" + info.installationLocation + '<br>' +
            "<b>City: </b>" + info.installationCity + '<br>' +
            "<b>Distance: </b>" + distance_value.toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' mm<br>' +
            "<b>Angle: </b>" + info.ang + ' deg<br>' +
            "<b>Temperature: </b>" + info.temp + ' °C<br>' +
            "<b>Signal Strength: </b>" + Math.trunc(info.signalStre).toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' dBm<br>' +
            "<b>Battery Status: </b>" + info.batteryVolt + ' V<br>' +
            '</div>';
        
        var streetCityName = info.installationLocation + ', ' + info.installationCity;
         marker.sensorContent = '<div class="history_block" >' +
            '<div class="history_block" >' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i>' + info.aTreeNode_installation +
            '<br>' + streetCityName + ' <span class="data-date"></span> </li>' + //IS-416
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Last Communication Timestamp:</span> ' + datee + ' ' + timee + '</span> <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Distance:</span> ' +
            distance_value.toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' mm <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Angle: </span>' + info.ang + ' deg <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Temprature: </span>' + info.temp + ' °C<span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Battery Voltage:</span> ' + info.batteryVolt + ' V <span class="data-date"></span> </li>' +
            '<li> <span class="data_name"><i class="fa fa-gg-circle" aria-hidden="true"></i> <span>Signal Strength:</span> ' + Math.trunc(info.signalStre).toLocaleString(undefined, { maximumFractionDigits: info.decimalPlaces }) + ' dBm <span class="data-date"></span> </li>' +
            '</div>';
        '</div>';

        marker.addListener('click', function () {
            let markers = tracknetMap.marker;
                
            for (var i = markers.length - 1; i >= 0; i--) {
                if (markers[i].id == marker.id) {
                    tracknetMap.infoWindow.setContent('<h2>' + $scope.locationData[marker.id].aTreeNode_installation + '</h2>' + markers[i].content);
                    $scope.locationData[marker.id].marker = markers[i];
                    break;
                }
            }
            
            tracknetMap.infoWindow.open(map, marker);
            $scope.$emit('serialNumber', marker.id);
        });

        tracknetMap.marker.push(marker);
        return marker;
    }
});

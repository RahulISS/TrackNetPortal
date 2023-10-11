angular.module('mainCtrl', [])

   .controller('mainController', function($scope, $rootScope, $state, $sessionStorage, Data, $http, $filter, apiBaseUrl, $window,$timeout) {

	if (localStorage.getItem("authToken") == '' || localStorage.getItem("authToken") == undefined) {
		$state.go('login');
		return;
	}

	const token =  localStorage.getItem("authToken");
	const customeHeader = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	};
	
	$scope.serverRequest = apiBaseUrl; 
	
	$scope.pointSettingData = '';
	$scope.emptyVal = 3998;
	$scope.fullVal = 400;
	$scope.showAlert1 = false;
	$scope.showAlert2 = false;
	$scope.showAlert3 = false;
	$scope.addAlertModel = false;
	$scope.alertError = false;
	$scope.disableBtn = false;
	$scope.deleteBtn = false;
	$scope.alert1Check = 0;
	$scope.alert2Check = 0;
	$scope.alert3Check = 0;
	$scope.addClass = '';
	$scope.btnValue = '';
	$scope.deleteModel = false;

	$scope.selectedDeviceIMEI = null;
	$scope.productImei = [];
	$scope.groupNode = []
	$scope.optionElements = [];
	$scope.formSubmitdata = [];
	$rootScope.fullAddress = []; /*defined the globally*/
	$scope.tableData = [];
	$scope.imagesData = [];
	$scope.installationName = null;
	$scope.lattitude = "";
	$scope.longitude = "";
	$scope.portal = [];
	$scope.selectedOption = "";
	$scope.newGroupNode = [];
	$scope.selectedNewGroup = "";
	var imgData = [];
	$scope.newPortal = [];
	$scope.selectedNewPortal = "";
	$scope.selectedPortal = "";
	$scope.successMessagebool = "";
	$scope.timeZone = [];
	$scope.isLoading = false;
	$scope.files = [];
	$scope.myClass1 = '';
  	$scope.myClass2 = '';
	$scope.manholeTabelData = false;
	
 	$scope.thisyear = moment().format("YYYY");

	$rootScope.storage = $sessionStorage.$default({
		username: null,
		userID: null,
		skysparkCookie: false,
		loggedIn: false,
		settingsBarActive: false,
		intervalIndex: 0,
		foldIndex: 0,
		firstDateChart: moment(new Date).format("YYYY-MM-DD"),
		secondDateChart: moment(new Date).format("YYYY-MM-DD"),
		firstDateSample: moment(new Date).format("YYYY-MM-DD"),
		secondDateSample: moment(new Date).format("YYYY-MM-DD"),
		measurementIndexChart: 0,
		measurementIndexSample: 0,
		measurementIndexCalibration: 0,
		meterTree: []
	});

  	if($rootScope.storage.loggedIn == false){
	 	 window.location.hash = "#!/login";
  	}

	$scope.signOut = function(){
		$window.localStorage.removeItem('authToken'); 
		$rootScope.storage.loggedIn = false;
		$rootScope.storage.skysparkCookie = false;
		$rootScope.storage.settingsBarActive = !$rootScope.storage.settingsBarActive;
		$rootScope.storage.$reset();
		$state.go('login');
		window.location.reload();
	}

	/**function to get IMEI options*/ 
	function loadProductsIMEI(portalName) {
		
		if( $scope.selectedOption == "add" ) {
			var query = $scope.serverRequest+`getSerialID?portal=${portalName}&type=add`;
		} else {
			var query = $scope.serverRequest+`getSerialID?portal=${portalName}&type=edit`;
		}
		
		$http.get(query, { headers : customeHeader }).then(function (response) {
			if (!Array.isArray(response.data.data)) {
				response.data.data = [];
			}
			response.data.data.unshift({
				prod_data : 'TracNet Sensor IMEI Id',
			})
			$scope.productImei = response.data.data;
			$scope.selectedProductImei = $scope.productImei[0];
			$scope.imei = function() {
				$scope.isLoading = true;
					let imeiFullName = $scope.selectedProductImei.aTreeNodeRef;
					let productId = $scope.selectedProductImei.prod_data.split('-')[0].replace(/[\s]/g, '');
					let aTL = $scope.selectedProductImei.prod_data.split('-')[1];
					let installatioName = imeiFullName.slice(imeiFullName.indexOf('-') + 1);			
					getSerialName(productId);
					textLabel(imeiFullName);
					$scope.getPorudctImages($scope.selectedProductImei.productId); 
					dynamicTableData(productId)
					$http.get($scope.serverRequest+`location`, { headers : customeHeader }).then(function (res) {
						$scope.selectedValue = res.data.data[0].val;
					}).finally(function() {
						$scope.isLoading = false;
					});
			}
			$(document).ready(function() {
				$(".existing-imei").select2();
			  });
			/*this function will auto focus when select option will open*/
			$(document).on('select2:open', () => {
				document.querySelector('.select2-search__field').focus();
			});
		 }).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          });
	}






	function getSerialName(productIMEI) {
		$scope.serialName = productIMEI;
		$scope.manholeTabelData = true;
	}

	$scope.productStatus = '';

	function textLabel(text) {
		const payload = {
			aTreeNode_id: text.trim(),
		};
		$http.get($scope.serverRequest+`getDeviceStatus/` + $scope.serialName, { headers : customeHeader }).then(function (result) {
			$scope.productStatus = result.data.data.status;
			if($scope.productStatus == 0 ){
				$scope.myClass2 = 'disabled-btn-custom';
				$scope.myClass1 = '';
			}
			if($scope.productStatus == 1 ){
				$scope.myClass1 = 'disabled-btn-custom';
				$scope.myClass2 = '';
			}

			$scope.selectStatus=$scope.productStatus;
		}).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          });
 
		$http.post($scope.serverRequest+`mobile-config-types`, payload, { headers : customeHeader }).then(function (response) {
			res = response.data.data;
			
			$scope.status = $scope.productStatus;			
			$scope.siteName = res.a_tree_node.textLabel;

			if(res.location != null || res.location != undefined ){
				
				$scope.selectedValue = res.location.tz;
				$scope.elat = res.location.latitude;
				$scope.elan = res.location.longitude;
				if( res.setting != null || res.setting != undefined ){
					$scope.bench = (res.setting.bench)??'';
					$scope.invert = (res.setting.invert??'');
					$scope.diameter = (res.setting.diameter)??'';
					$scope.siteNotes = (res.setting.siteNotes)??'';
					$scope.optionsSewerSel = (res.setting.sewer)+ ''??'';
				}else{
					$scope.status = 0;
					$scope.bench = '';
					$scope.invert = '';
					$scope.diameter = '';
					$scope.siteNotes = '';
					$scope.optionsSewerSel = '';
				}
			}else{
				$scope.selectedValue = '';
				$scope.elat = '';
				$scope.elan = '';

			}
		}).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          });
	}

	/**this function is used to get geolocation*/ 
	var mysrclat = 0;
	var mysrclong = 0;
	$scope.mysrclat = '';
	$scope.nearme = function() {
		if ($window.navigator.geolocation) {
			$window.navigator.geolocation.getCurrentPosition(function(position) {
				mysrclat = position.coords.latitude;
				mysrclong = position.coords.longitude;
				$scope.$evalAsync(function() {
						$scope.elat = mysrclat;
						$scope.elan = mysrclong;
						GetAddress($scope.elat,$scope.elan);
				});
				$scope.latitude = position.coords.latitude;
				$scope.longitude = position.coords.longitude;
				//$scope.$apply();
			  },
			  function(error) {
				console.error('Error getting geolocation:', error);
			  }
			);
		} else {
			console.error('Geolocation is not supported by this browser.');
		}
	} 

	function GetAddress(lat, lng) {
		// Define the API endpoint URL with your latitude and longitude coordinates
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDvsK5T7lDZbqCgXUC5A7-eZwSSVPGJy5k`;
		// Make a request to the API endpoint using fetch
		fetch(url)
		.then(response => response.json())
		.then(data => {
			// Access the response data here
						address_components = data.results[0].address_components;
						for (let i = 0; i < address_components.length; i++) {
							if ( address_components[i].types[0] === "street_number" || address_components[i].types[0] === "route" ||  address_components[i].types[0] === "neighborhood" || address_components[i].types[0] === 'plus_code' ||  address_components[i].types[0] === "sublocality" || address_components[i].types[0] === "political" || address_components[i].types[0] === "premise") {
								$scope.street_number = address_components[i].short_name;    
							}
							if (address_components[i].types[0] === "locality" && address_components[i].types[1] === "political" ) {                                
								$scope.city = address_components[i].long_name;   
							}
							if (address_components[i].types[0] === "postal_code" || address_components[i].types[0] === 'postal_code_prefix' || address_components[i].types[0] === 'postal_code_suffix') {
								$scope.zipcode = address_components[i].long_name;
							}
							if (address_components[i].types[0] === "country" || address_components[i].types[1] === "political") {
								$scope.tz = address_components[i].long_name;
							}
							if(address_components[i].types[0] === "administrative_area_level_1" || address_components[i].types[1] === "political"){
								$scope.state = address_components[i].short_name;
							}
						}		

				$rootScope.fullAddress = {
						"street": $scope.street_number,
						"city": $scope.city,
						"state":$scope.state,
						"postcode": $scope.zipcode,
						"tz": $scope.tz
					}
		})
		.catch(error => {
			// Handle any errors here
			console.error(error);
		});
	}
	
	/**registering variable to fetch options type*/
	$http.get($scope.serverRequest+`mobile-option-types`, { headers : customeHeader }).then(function (response) {
		$scope.optionsTypes = response.data.data;
		$scope.optionsTypesSel = $scope.optionsTypes[0];
	}).catch(function(error){
		if(error.status==401){
		  $window.localStorage.removeItem('authToken');
		  $rootScope.storage.loggedIn = false;
		  $rootScope.storage.authToken = false;
		  $rootScope.storage.$reset();
		  $scope.refreshPage();
		  $state.go('login');
		}
	  }); 
	

	/*Coded by the Firoz Khan*/
	/*Creating the function to upload and preview multiple images in Owl Slider*/
	$(document).ready(function() {
		hideBtn();
	  if (window.File && window.FileList && window.FileReader) {
	    $("#upload-img").on("change", function(e) {
	      var files = e.target.files,	      
	       filesLength = files.length;

	       /*fetch all images through to looping*/
	      for(var i = 0; i < filesLength; i++) { 
	        var file = files[i];
	        let fileReader = new FileReader(); 
	        	fileReader.onload = (function(e) {

	          /*create owl slider function to remove and add the items*/
	          $('.owl-carousel').trigger('add.owl.carousel', [$("<div class='item' ><img class = 'close__x' src = 'img/x-circle.svg'><img src="+ e.target.result +" class='user__upload'></div>"), 0]).trigger('refresh.owl.carousel');
	          $(".owl-item").on("click", function (event) {
			    var items = $(".owl-item");
			    items.each((index, item) => {
			      if (item.isEqualNode(event.currentTarget)) {
			        $(".owl-carousel").trigger("remove.owl.carousel", index).trigger("refresh.owl.carousel");
			        return;
			      }
			    });
			    /*this condition to use when the hide arrow*/
			    var itemCount = $(".item").length; 
			    if(itemCount == 3){
			     hideBtn();
			    }
			  }); 
			  /*this condition to use when the show arrow*/
			  var itemCount = $(".item").length; 
			  if(itemCount == 4){
			  	showBtn()
			  }
	        }); 
	        fileReader.readAsDataURL(file);
	      }
	    });
	  }
	  /*this function creating for the hide and show the data*/
	  function hideBtn(){ 
		  $("#sliderBtn").hide();
		}
		function showBtn(){
			$("#sliderBtn").show();
		}
	
	}); 

	$scope.selectStatus = '';
	$scope.getButtonValue = function(buttonValue) {
		//alert(buttonValue)
		$scope.selectStatus = buttonValue;
		if (buttonValue === '1') {
			$scope.myClass1 = 'disabled-btn-custom';
			$scope.myClass2 = '';
		  } else if (buttonValue === '0') {
			$scope.myClass1 = '';
			$scope.myClass2 = 'disabled-btn-custom';
		  }
		
	};
	

	var returnCount = [];
	function dynamicManholeTable(productIMEI,installationName){
		$scope.errorAlt1 = ''; $scope.errorAlt2 = ''; $scope.errorAlt3 = '';
		returnCount.length = 0
		localStorage.setItem("node_name", installationName)
		$scope.alarmCount = 0;
		$scope.pointSettingData = '';
		$scope.serialNo = productIMEI;
		const query = `read( aYvwTracnetManholeSpecification and productRef->id_serial == "${$scope.serialNo}")`;
			Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function(response){
				$scope.pointSettingData = response.data.rows[0];
				if( typeof $scope.pointSettingData === 'undefined' ) { 
					$scope.alarmCount = 0;
					$scope.alert1 = 0;
					$scope.alert2 = 0;
					$scope.alert3 = 0;

				} else {
					
					$scope.alarmCount =  parseInt(($scope.pointSettingData.alarmFirst )? 1 : 0) + parseInt(($scope.pointSettingData.alarmSecond)? 1 : 0) + parseInt(($scope.pointSettingData.alarmThird )? 1 : 0)
					$scope.emptyVal = ( $scope.pointSettingData.empty ) ? $scope.pointSettingData.empty : 3998;
					$scope.fullVal = ( $scope.pointSettingData.full ) ? $scope.pointSettingData.full : 400;
					$scope.alert1 = $scope.pointSettingData.alarmFirst;
					$scope.alert2 = $scope.pointSettingData.alarmSecond;
					$scope.alert3 = $scope.pointSettingData.alarmThird;
					$scope.alert1Check = $scope.pointSettingData.alarmFirstCheck;
					$scope.alert2Check = $scope.pointSettingData.alarmSecondCheck;
					$scope.alert3Check = $scope.pointSettingData.alarmThirdCheck;
					/** Setting alert blur as per thier check value starts*/
					if( $scope.pointSettingData.alarmFirstCheck === undefined ) {
						$scope.addAlt1Class = 'alertLight';
						$scope.disAlt1 = '';						
						$scope.altStatus1 = 'Disabled';
						$scope.a1 = '';
					} else {
						
						$scope.addAlt1Class = '';
						$scope.disAlt1 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert1 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100)+"%";
						$scope.altStatus1 = '';
						$scope.a1 = $scope.alert1;
					}

					if( $scope.pointSettingData.alarmSecondCheck === undefined ) {
						$scope.addAlt2Class = 'alertLight';
						$scope.disAlt2 = '';
						$scope.altStatus2 = 'Disabled';
						$scope.a2 = '';
					} else {
						$scope.addAlt2Class = '';
						$scope.disAlt2 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert2 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100)+"%";
						$scope.altStatus2 = '';
						$scope.a2 = $scope.alert2
					}

					if( $scope.pointSettingData.alarmThirdCheck === undefined ) {
						$scope.addAlt3Class = 'alertLight';
						$scope.disAlt3 = '';
						$scope.altStatus3 = 'Disabled';
						$scope.a3 = '';
					} else {
						$scope.addAlt3Class = '';
						$scope.disAlt3 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert3 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100)+"%";
						$scope.altStatus3 = '';
						$scope.a3 = $scope.alert3
					}
					/**ends */
				}
			});	
	}
	/*End*/


	// Manhole Specification onCHnage event
	var totalCount = [];
	$scope.onInputChange = function(index,inputName) {
		returnCount.length = 0;
		$timeout(function() {
			var alert1Value = parseInt(angular.element($("#alert1")).val());
			var alert2Value = parseInt(angular.element($("#alert2")).val());
			var alert3Value = parseInt(angular.element($("#alert3")).val());
			if( isNaN(alert1Value) && isNaN(alert2Value) && isNaN(alert3Value) ){
				$scope.disableReset = true;
				$scope.disableClass = "disableClass";
			}else{
				$scope.disableReset = false;
				$scope.disableClass = "";
			}
			if( inputName == "alert1" ){
				alert1Value = index;
			}else if( inputName == "alert2" ){
				alert2Value = index;
			}else if( inputName == "alert3" ){
				alert3Value = index;
			}
			$scope.errorAlt1 = ''; $scope.errorAlt2 = ''; $scope.errorAlt3 = '';

			let full = angular.element($("#fullValue")).val();
			let empty = angular.element($("#emptyValue")).val();
	
			// Sort the alert values
			const values = [alert1Value, alert2Value, alert3Value];
			var sortedValues = values.filter(value => !isNaN(value)).sort(function(a, b) {
				return a - b;
			});

			let newValue = parseInt(index);
			let fullAlarm = ( full ) ? parseFloat(full) : 400;
			let emptyAlarm = ( empty ) ? parseFloat(empty) : 3998;
			
			if (!isNaN(newValue)) {
				
				// Check for duplicate values
				for (i = 1; i < 4; i++) {
					totalCount[i] = document.getElementById("alert" + i).value;
				}
				for (i = 0; i < 4; i++) {
					for (j = i + 1; j < 4; j++) {
						if (i == j || totalCount[i] == "" || totalCount[j] == "")
							continue;
						if (totalCount[i] == totalCount[j]) {
							returnCount.push(i)
						}
					}
				}
				if(inputName === "fullVal"){

					if(fullAlarm >= 400 && fullAlarm <= 3998){
						$scope.bOneErr = false;
						$scope.errorfull =  '';
					}else{
						$scope.bOneErr = true;
						$scope.errorfull =  "Invalid value*";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}

					if(alert3Value < fullAlarm){
						$scope.bOneErr = true;
						$scope.errorfull =  "Full Should be <= 'Every Alert value'";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}
					if(alert2Value < fullAlarm){
						$scope.bOneErr = true;
						$scope.errorfull =  "Full Should be <= 'Every Alert value'";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}
					if(alert1Value < fullAlarm){
						$scope.bOneErr = true;
						$scope.errorfull =  "Full Should be <= 'Every Alert value'";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}						
					$scope.btnDisabled = false;
					$scope.bOneErr = false;
					$scope.errorfull = '';
				}


				if(inputName === "emptyVal"){				

					if((emptyAlarm <= 3998 )){
						$scope.bTwoErr = false;
						$scope.errorempty =  '';
					}else{
						$scope.bTwoErr = true;
						$scope.errorempty =  "Invalid value*";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}

					if(alert3Value > emptyAlarm){
						$scope.bTwoErr = true;
						$scope.errorempty =  "Empty Should be >= Every Alert value";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}
					if(alert2Value > emptyAlarm){
						$scope.bTwoErr = true;
						$scope.errorempty =  "Empty Should be >= Every Alert value";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;

					}
					if(alert1Value > emptyAlarm){
						$scope.bTwoErr = true;
						$scope.errorempty =  "Empty Should be >= Every Alert value";
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						return false;
					}
					$scope.btnDisabled = false;
					$scope.bTwoErr = false;
					$scope.errorempty = ''
				}


				if ( returnCount.length > 0) {						
					$scope.btnDisabled = 'disabledprop';
					if(inputName === "alert1"){
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						$scope.alrErr = true;
						$scope.errorAlt1 = 'Duplicate Alert!'; // Set error message
						return;
					}
					if(inputName === "alert2"){
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						$scope.alrErr = true;
						$scope.errorAlt2 = 'Duplicate Alert!'; // Set error message
						return;
					}
					else{
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						$scope.alrErr = true;
						$scope.errorAlt3 = 'Duplicate Alert!'; // Set error message
						return;
					}
			
				}
				
				
				else if(parseInt(newValue) < fullAlarm){
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						if(inputName === "alert1"){
							$scope.alrErr = true;
							$scope.disAlt1 = '';
							$scope.altStatus3 = 'Disabled';
							$scope.errorAlt1 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; // Set error message
							return;
						}
						if(inputName === "alert2"){
							$scope.alrErr = true;
							$scope.disAlt2 = '';
							$scope.altStatus3 = 'Disabled';
							$scope.errorAlt2 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; // Set error message
							return;
						}
						if(inputName === "alert3"){
							$scope.alrErr = true;
							$scope.disAlt3 = '';
							$scope.altStatus3 = 'Disabled';
							$scope.errorAlt3 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; // Set error message
							return;
						}
					}
					else if(parseInt(newValue) > emptyAlarm){
						$scope.btnDisabled = true;
						$scope.disableBtn = "disableBtn"
						if(inputName === "alert1"){
							$scope.alrErr = true;
							$scope.errorAlt1 = "Alert Should be <= 'Empty 0%' value or "+ emptyAlarm; // Set error message
							return false;
						}
						if(inputName === "alert2"){
							$scope.alrErr = true;
							$scope.errorAlt2 = "Alert Should be <= 'Empty 0%' value or "+ emptyAlarm; // Set error message
							return false;
						}
						if(inputName === "alert3"){
							$scope.alrErr = true;
							$scope.errorAlt3 = "Alert Should be <= 'Empty 0%' value or "+ emptyAlarm; // Set error message
							return false;
						}
					}
				else {
					//$scope.errorAlt1 = ''; $scope.errorAlt2 = ''; $scope.errorAlt3 = '';
					$scope.btnDisabled = false;
					$scope.disableBtn = '';
					$scope.btnDisabled = '';
					$scope.errorempty = ''; 
					$scope.errorfull = '';
					$("#alert1").val(sortedValues[2]);
					$("#alert2").val(sortedValues[1]);
					$("#alert3").val(sortedValues[0]);
					var alert1Value = parseInt(angular.element($("#alert1")).val());
					var alert2Value = parseInt(angular.element($("#alert2")).val());
					var alert3Value = parseInt(angular.element($("#alert3")).val());
					
				}
				
				if(alert1Value && !alert1Value < fullAlarm && !alert1Value > emptyAlarm){
					$scope.btnDisabled = false;
					$scope.disableBtn = '';
					$('#alert1').removeClass('alertLight');
					$('#alert-label1').removeClass('alertLight');
					$('#alt-status1').text("");				
					$scope.disAlt1 = Math.round(((( emptyAlarm - fullAlarm)-(alert1Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";	
					$('#disAlt1').text($scope.disAlt1+"%");				
				}
				if(alert2Value && !alert2Value < fullAlarm && !alert2Value > emptyAlarm){
					$scope.btnDisabled = false;
					$scope.disableBtn = ''
					$('#alert2').removeClass('alertLight');
					$('#alert-label2').removeClass('alertLight');
					$('#alt-status2').text("");
					$scope.disAlt2 = Math.round(((( emptyAlarm - fullAlarm)-(alert2Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";
					$('#disAlt2').text($scope.disAlt2+"%");
				}
				if(alert3Value && !alert3Value < fullAlarm && !alert3Value > emptyAlarm){
					$scope.btnDisabled = false;
					$scope.disableBtn = ''
					$('#alert3').removeClass('alertLight');
					$('#alert-label3').removeClass('alertLight');
					$('#alt-status3').text("");
					$scope.disAlt3 = Math.round(((( emptyAlarm - fullAlarm)-(alert3Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";
					$('#disAlt3').text($scope.disAlt3+"%");
				}
				if(alert3Value === undefined || isNaN(alert3Value)){
					$scope.addAlt3Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = ''
					$scope.disAlt3 = '';
					$scope.altStatus3 = 'Disabled';
				}
				if(alert2Value === undefined || isNaN(alert2Value)){
					$scope.addAlt2Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = ''
					$scope.disAlt2 = '';
					$scope.altStatus2 = 'Disabled';
				}
				if(alert1Value === undefined || isNaN(alert3Value)){
					$scope.addAlt1Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = ''
					$scope.disAlt1 = '';
					$scope.altStatus1 = 'Disabled';
				}
				if(alert1Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt1 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					return ;
				}
				if(alert2Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt2 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					return ;
				}
				if(alert3Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt3 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					return ;
				}

				if(alert1Value){
					$scope.addAlt1Class = '';
					$scope.altStatus1 = '';
					$scope.disAlt1 = Math.round(((( emptyAlarm - fullAlarm)-(alert1Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";
				}
				if(alert2Value){
					$scope.addAlt2Class = '';
					$scope.altStatus2 = '';
					$scope.disAlt2 = Math.round(((( emptyAlarm - fullAlarm)-(alert2Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";
				}
				if(alert3Value){
					$scope.addAlt3Class = '';
					$scope.altStatus3 = '';
					$scope.disAlt3 = Math.round(((( emptyAlarm - fullAlarm)-(alert3Value - fullAlarm )) / (emptyAlarm - fullAlarm)) * 100)+"%";
				}
			}else{
				if(alert1Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt1 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					//return ;
				}
				if(alert2Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt2 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					//return ;
				}
				if(alert3Value < fullAlarm){
					$scope.btnDisabled = true;
					$scope.disableBtn = "disableBtn";
					$scope.alrErr = true;
					$scope.errorAlt3 =  "Alert Should be >= 'Full 100%' value or "+ fullAlarm; 
					//return ;
				}
				if(inputName == "alert1"){
					$scope.addAlt1Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = "";
					$scope.disAlt1 = '';
					$scope.altStatus1 = 'Disabled';
					$scope.errorAlt1 = '';
				}
				if(inputName == "alert2"){
					$scope.addAlt2Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = "";
					$scope.disAlt2 = '';
					$scope.altStatus2 = 'Disabled';
					$scope.errorAlt2 = '';
				}
				if(inputName == "alert3"){
					$scope.addAlt3Class = 'alertLight';
					$scope.btnDisabled = false;
					$scope.disableBtn = "";
					$scope.disAlt3 = '';
					$scope.altStatus3 = 'Disabled';
					$scope.errorAlt3 = '';
				}
			}
		}, 100); // 1000 milliseconds = 1 seconds

	}
	// end


	$scope.disableReset = false;
	$scope.resetAlert = function(){
		var confirmation = confirm("Are Want To Sure To Reset All Alerts !");
		if( confirmation === true ){			
		$('#alert1').val('');
		$('#alert2').val('');
		$('#alert3').val('');
		$scope.addAlt1Class = 'alertLight';
		$scope.btnDisabled = '';
		$scope.errorAlt1 = '';
		$scope.disAlt1 = '';
		$scope.altStatus1 = 'Disabled';

		$scope.alert2 = null;
		$scope.addAlt2Class = 'alertLight';
		$scope.btnDisabled = '';
		$scope.errorAlt2 = '';
		$scope.disAlt2 = '';
		$scope.altStatus2 = 'Disabled';

		$scope.alert3 = null;
		$scope.addAlt3Class = 'alertLight';
		$scope.btnDisabled = '';
		$scope.errorAlt3 = '';
		$scope.disAlt3 = '';
		$scope.altStatus3 = 'Disabled';
		
	   if( angular.element($('#alert1')).val() == ""  && angular.element($('#alert2')).val() == "" && angular.element($('#alert3')).val() == ""){
		$scope.disableReset = true;
		$scope.disableClass = "disableClass";
		}
	 }
	}


		/*saving relative distance alerts*/
		$scope.saveAlertData = function(){
			const enabled = 1;
			var point_id = localStorage.getItem("pointId");
			$scope.serialNo = localStorage.getItem("productId");
			var val = angular.element($(".alertNumber")).val();
			var alertF = angular.element($('#alert1')).val();
			var alertS = angular.element($('#alert2')).val();
			var alertT = angular.element($('#alert3')).val();
			
			if( alertF ) {
				$scope.alert1 = alertF;
				$scope.alarmFirstCheck = enabled;	
			}  else {
				$scope.alert1 = null;
				$scope.alarmFirstCheck = null;	
			}
			
			if( alertS ) {
				$scope.alert2 = alertS;
				$scope.alarmSecondCheck = enabled;	
			} else {
				$scope.alert2 = null;
				$scope.alarmSecondCheck = null;
			}
			
			if( alertT) {
				$scope.alert3 = alertT;
				$scope.alarmThirdCheck = enabled;	
			} else {
				$scope.alert3 = null;
				$scope.alarmThirdCheck = null;
			}
			/** disable starts*/
			if( $scope.enableBtn ) {
				if( 'alt1' in $scope.disableAlertArray && $scope.disableAlertArray.alt1 === true && 'alarmFirstCheck' in $scope.pointSettingData ) {
					if($scope.pointSettingData.alarmFirstCheck === 0) {
						$scope.alarmFirstCheck = 1;
					} else {
						$scope.alarmFirstCheck = null;
					}
				}
			
				if( 'alt2' in $scope.disableAlertArray && $scope.disableAlertArray.alt2 === true && 'alarmSecondCheck' in $scope.pointSettingData ) {
					if($scope.pointSettingData.alarmSecondCheck === 0) {
						$scope.alarmSecondCheck = 1;
					} else {
						$scope.alarmSecondCheck = null;
					}
				}
	
				if( 'alt3' in $scope.disableAlertArray && $scope.disableAlertArray.alt3 === true && 'alarmThirdCheck' in $scope.pointSettingData ) {
					if($scope.pointSettingData.alarmThirdCheck === 0) {
						$scope.alarmThirdCheck = 1;
					} else {
						$scope.alarmThirdCheck = null;
					}
				}
			}
			
			$scope.fullValue = angular.element($('#fullValue')).val();
			$scope.emptyValue = angular.element($('#emptyValue')).val();
			if( !$scope.fullValue || !$scope.emptyValue) {
				alert("Setting Boundaries are Required")
				return;
			}
	
			if( $scope.fullValue < 400 ) {
				//alert("Full Value Should be >= 400")
				$scope.btnDisabled = true;
				return false;
			}
			
			if( parseInt($scope.emptyValue) <  parseInt($scope.fullValue) ) { 
				//alert("Full Value Should be less than Empty Value")
				$scope.btnDisabled = true;
				return false;
			}
	
			if( parseInt($scope.emptyValue) < parseInt($scope.fullValue) ) {
				//alert("Empty Value Should be greater than Full Value")
				$scope.btnDisabled = true;
				return false;
			}
	
			if(parseInt($scope.emptyValue) < parseInt(alertF) || parseInt($scope.emptyValue) < parseInt(alertS) || parseInt($scope.emptyValue) < parseInt(alertT)) {
				//alert("Invalid Alert Value")
				$scope.btnDisabled = true;
				return false;
			}
			
			if( parseInt($scope.emptyValue) > 3998 ) {
				//alert("Empty Value Should be less than equal to 3998")
				$scope.btnDisabled = true;
				return false;
			}
	
			if( parseInt(alertF) < parseInt($scope.fullValue) && parseInt(alertF) > parseInt($scope.emptyValue) ) {
				//alert("Alert Values Should be in between Full and Empty value")
				$scope.btnDisabled = true;
				return false;
			}
			if( parseInt(alertS) < parseInt($scope.fullValue) && parseInt(alertS) > parseInt($scope.emptyValue) ) {
				//alert("Alert Values Should be in between Full and Empty value")
				$scope.btnDisabled = true;
				return false;
			}
			if( parseInt(alertT) < parseInt($scope.fullValue) && parseInt(alertT) > parseInt($scope.emptyValue) ) {
				//alert("Alert Values Should be in between Full and Empty value")
				$scope.btnDisabled = true;
				return false;
			}

			let formData = {
				"pointId": point_id,
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


	  
	
			$http.post(apiBaseUrl+"add-user-definded-distancealert",formData, {headers:customeHeader}).then(function (response) {
				const data = response.data;
					if(data.status){
						Swal.fire({
							position: 'center',
							icon: 'success',
							title: 'Alert Saved!',
							showConfirmButton: false,
							timer: 2000,
							customClass: {
								container: 'mobile-alert-container',
								popup: 'mobile-alert-popup',
								header: 'mobile-alert-header',
								content: 'mobile-alert-content',
								actions: 'mobile-alert-actions',
								confirmButton: 'mobile-alert-confirm-button'
							},
						  })
						$scope.showModal = false;
						window.scrollTo(0, 0);
						$rootScope.storage.$reset();
						setTimeout(function() {	
							$window.location.hash = "#!/login";
						}, 3000);
					}
					else if(data.status == 400) {
						alert(data.msg);
					}
			}).catch(function(error){
				if(error.status==401){
				  $window.localStorage.removeItem('authToken');
				  $rootScope.storage.loggedIn = false;
				  $rootScope.storage.authToken = false;
				  $rootScope.storage.$reset();
				  $scope.refreshPage();
				  $state.go('login');
				}
			  });
		};

		//end

	
	/*this funtion is used to sent json data into the skyspark*/
	
	$scope.formData = function() {
		$scope.fl = angular.element($('#upload-img')).val();
		$scope.newPortalName = angular.element($('#portal')).val();
		$scope.portalName = $scope.selectedPortal.id_name;
		$scope.newGroupName = angular.element($('#newGroupName')).val();
		$scope.groupNodeName = angular.element($('#groupName')).val();
		$scope.siteName = angular.element($('#siteName')).val();
		$scope.imei = angular.element($('#imei')).val();
		$scope.Serial = $scope.serialName;
		$scope.simCarrier = angular.element($('#simCarrier')).val();
		$scope.lattitude = angular.element($('#lattitude')).val();
		$scope.longitude = angular.element($('#longitude')).val();
		$scope.sewer = angular.element($('#sewer')).val();
		$scope.bench = angular.element($('#bench')).val();
		$scope.invert = angular.element($('#invert')).val();
		$scope.diameter = angular.element($('#diameter')).val();
		$scope.siteNotes = angular.element($('#siteNotes')).val();
		$scope.timeZoneName = angular.element($('#timeZoneValue')).val();
		$scope.selectedOption="edit";
		$scope.status = $scope.selectStatus;
		
		// if( $scope.lattitude != null || $scope.longitude == null || $scope.groupNodeName == null || $scope.siteName == null || $scope.imei == null) {		
		// 	console.log($scope.lattitude,"control here");	
		// 	$scope.invalid_message = "* Required Field";
		// } else {
		// 	console.log('else');
		if($scope.Serial == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Please select Sensor IMEI',
				showCancelButton: false, // Hide the "Cancel" button
				confirmButtonText: 'OK', // Change the "OK" button text
			  }).then((result) => {
				// Check if the user clicked the "OK" button
				if (result.isConfirmed) {
				  // Reload the page
				  	window.location.reload();
					return;
				}
			});
			return;
		}
		if($scope.lattitude == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Lattitude is require',
			});
			return;
		}
		if($scope.longitude == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Longitude is require',
			});
			return;
		}
		if($scope.timeZoneName == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Please select TimeZone',
			});
			return;
		}
		if($scope.sewer == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Please select product type',
			});
			return;
		}
		if($scope.status == undefined){
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Please choose product status',
			});
			return;
		}
			
			/*Create the JSON Object and Store the Input Data*/
			$scope.formSubmitdata = {
				    "newPortalName": $scope.newPortalName,
				    "portalName": $scope.portalName,
					"newGroupName": $scope.newGroupName,
					"groupName": $scope.groupNodeName,  
					"siteName": $scope.siteName.trim(), 
					"productImei": $scope.imei,
					"productSerial": $scope.Serial,
					"simCarrier": $scope.simCarrier,
					"lattitude": $scope.lattitude,
					"longitude" : $scope.longitude,
					"sewerStormwater": $scope.sewer,
					"depthToBench": $scope.bench,
					"depthToInvert": $scope.invert,
					"diameterOfMainPipe": $scope.diameter,
					"siteNotes": $scope.siteNotes,
					"street": $rootScope.fullAddress.street,
					"postcode": $rootScope.fullAddress.postcode,
					"state": $rootScope.fullAddress.state,
					"city": $rootScope.fullAddress.city,
					"tz": $rootScope.fullAddress.tz,
					"images": imgData,
					"timeZone": ($scope.timeZoneName ==0 || $scope.timeZoneName ==undefined)? '' : $scope.timeZoneName,
					"status": $scope.status
				}
			// }




		$rootScope.storage.sendFormData = $scope.formSubmitdata;
	
		const data = $rootScope.storage.sendFormData;
			// if( $scope.selectedOption == "move" ) { 
			// 	$scope.isLoading = true;
			// 	const query = `tracNet_Mobile_installation_move_01("${data.portalName}" , "${data.newPortalName}" , "${data.siteName}" , "${data.productSerial}" , "${data.groupName}" , "${data.newGroupName}" , "${data.lattitude}" , "${data.longitude}" , "${data.street}" , "${data.postcode}" , "${data.state}" , "${data.city}" , "${data.tz}" , "${data.depthToBench}")`;
			// 	Data.sendRequest(query,$rootScope.storage.skysparkVersion).then(function(response) {
			// 		let responseStatus = response.data.rows[0].status;
			// 		if(responseStatus == 200){
			// 			alert("Installation Moved Successfully");
			// 			this.myForm.reset();
			// 			window.scrollTo(0, 0);
			// 				let text = "To Perform more actions do re-login";
			// 				if (confirm(text) == true) {
			// 						var timeleft = 5;
			// 						var downloadTimer = setInterval(function(){
			// 						if(timeleft <= 0){
			// 							clearInterval(downloadTimer);
			// 							$scope.countdownStatus = "Finished";
			// 						} else {
			// 							$scope.countdownStatus = timeleft + " seconds remaining";
			// 						}
			// 						timeleft -= 1;
			// 						}, 1000);
			// 					}			
			// 				var downloadTimer = setTimeout(function() {
			// 					$rootScope.storage.$reset();				
			// 					window.location.hash = "#!/login";
			// 				}, 5000);
			// 		}
			// 	}).finally(function() {
			// 		$scope.isLoading = false;
			// 	});

			// }
			
			if( $scope.selectedOption == "edit" ) { 

				var fileInput = document.getElementById('upload-img');
				var files = fileInput.files;
				
				var formData = new FormData();
				for (var i = 0; i < files.length; i++) {
					formData.append('files[]', files[i]);
				}

				
				formData.append('portalName', data.portalName);
				formData.append('productSerial', data.productSerial);
				formData.append('siteName', data.siteName);
				formData.append('latitude', data.lattitude);
				formData.append('longitude', data.longitude);
				formData.append('timeZone', data.timeZone);
				formData.append('sewer', data.sewerStormwater);
				formData.append('bench', data.depthToBench);
				formData.append('invert', data.depthToInvert);
				formData.append('diameter', data.diameterOfMainPipe);
				formData.append('siteNotes',(data.siteNotes)??"This is test");
				formData.append('status', data.status);

				$scope.isLoading = true;
				$http.post($scope.serverRequest + 'tracnet-mobile-portal-update', formData, {
					transformRequest: angular.identity,
						headers: { 'Content-Type': undefined,'Authorization': `Bearer ${token}` }
				  }).then(function(response) {

					var responseStatus = response.data.status;				
					if(responseStatus == true ) {
						alert("Installation Updated Successfully");
						this.myForm.reset();
						window.scrollTo(0, 0);
							setTimeout(function() {	
								$rootScope.storage.$reset();			
								window.location.hash = "#!/login";
							}, 0);
						}
				    }).catch(function(error){
						if(error.status==422){
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: error.data.message,
						  });

						}
				

						if(error.status==401){
						  $window.localStorage.removeItem('authToken');
						  $rootScope.storage.loggedIn = false;
						  $rootScope.storage.authToken = false;
						  $rootScope.storage.$reset();
						  $scope.refreshPage();
						  $state.go('login');
						}
					  })
					.finally(function() {
						$scope.isLoading = false;
					});
			}
			
			// if( $scope.selectedOption == "add" ) {


			// 	var fileInput = document.getElementById('upload-img');
			// 	var files = fileInput.files;
				
			// 	var formData = new FormData();
			// 	for (var i = 0; i < files.length; i++) {
			// 		formData.append('files[]', files[i]);
			// 	}
				
			// 	formData.append('id_serial', data.productSerial);
			// 	formData.append('textLabel', data.siteName);
			// 	formData.append('latitude', data.lattitude);
			// 	formData.append('longitude', data.longitude);
			// 	formData.append('timeZone', data.timeZone);
			// 	formData.append('optionsTypes', data.sewerStormwater);
			// 	formData.append('bench', data.depthToBench);
			// 	formData.append('invert', data.depthToInvert);
			// 	formData.append('diameter', data.diameterOfMainPipe);
			// 	formData.append('siteNotes',(data.siteNotes)??"This is test");
				
			// 	$scope.isLoading = true;
			// 	$http.post($scope.serverRequest+'product', formData, {
			// 		transformRequest: angular.identity,
        	// 		headers: { 'Content-Type': undefined }
			// 	  }).then(function (response) {
					
			// 		let responseStatus = response.data.status;
			// 		if(responseStatus === true){
			// 			alert("Installation Added Successfully");
			// 			this.myForm.reset();
			// 			window.scrollTo(0, 0);

			// 			let text = "To Perform more actions do re-login";
			// 			if (confirm(text) == true) {
			// 					var timeleft = 5;
			// 					var downloadTimer = setInterval(function(){
			// 					if(timeleft <= 0){
			// 						clearInterval(downloadTimer);
			// 						$scope.countdownStatus = "Finished";
			// 					} else {
			// 						$scope.countdownStatus = timeleft + " seconds remaining";
			// 					}
			// 					timeleft -= 1;
			// 					}, 1000);
			// 				}			
			// 			var downloadTimer = setTimeout(function() {	
			// 				$rootScope.storage.$reset();			
			// 				window.location.hash = "#!/login";
			// 			}, 5000);
						
			// 		} 
			// 	}).catch(function(error){
			// 		if(error.status==401){
			// 		  $window.localStorage.removeItem('authToken');
			// 		  $rootScope.storage.loggedIn = false;
			// 		  $rootScope.storage.authToken = false;
			// 		  $rootScope.storage.$reset();
			// 		  $scope.refreshPage();
			// 		  $state.go('login');
			// 		}
			// 	  }).finally(function() {
			// 		$scope.isLoading = false;
			// 	});
			// }
		
		$scope.setFalse = function() {
			$rootScope.storage.loggedIn == true
		}
	}
	
	// end
	
	
	const convertDateStringToISOString = function (dateString) {
		const dateArray = dateString.split("_");
		const datePart = dateArray[0].split("-").map(Number);
		const timePart = dateArray[1].split("-").map(Number);
		const date = new Date(Date.UTC(datePart[0], datePart[1] - 1, datePart[2], timePart[0], timePart[1], timePart[2]));
	  
		return date;
	  };
	
	/*this function is for dynamic table data*/ 
	function dynamicTableData (productIMEI) {
		$scope.tableData = [];
		$scope.showModal = false;
		$http.get($scope.serverRequest+`dynamicTable/${productIMEI}`, { headers : customeHeader }).then(function (result) {
			const response = result.data.data;
			if(response == ''){
				alert("Data not present...")
				return;
			}
			localStorage.setItem("pointId", response[0]._id);
			var convertedData = [];

			for (var i = 0; i < response.length; i++) {
				var data = response[i];				
				const inputDateString = data.date;
				const ttemp = convertDateStringToISOString(inputDateString);
				const singaporeTime = moment(ttemp).tz("Asia/Singapore");
				var timee = singaporeTime.format("h:mm:ss A");
				var datee = singaporeTime.format("ddd, MMMM Do YYYY");
				
				var formattedDate = `${datee}, ${timee} `
				var distanceValue = "";
				if( data.height <= 400)
				    distanceValue = 400;
				else if( data.height >= 3998 )
					distanceValue = "";
				else 
				    distanceValue = parseInt(data.height);
				var convertedPoint = { 
					date: formattedDate,
					height: distanceValue,
					angle: data.angle,
					temperature: data.temperature, 
					signalStrengthValue: parseInt(data.signal_strength), 
					
				};
				convertedData.push(convertedPoint);
			}
			$scope.tableData = convertedData;
		}).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          });
		if($scope.tableData){
			$http.get($scope.serverRequest+`getDistanceAlert/${productIMEI}`, { headers : customeHeader }).then(function (result) {
				
				if(result.data.data !== null)
				$scope.pointSettingData = result.data.data.distance_alert;
			
				if($scope.pointSettingData === null) { 
					$scope.alarmCount = 0;
					$scope.alert1 = '';
					$scope.alert2 = '';
					$scope.alert3 = ''; $scope.altStatus1 = 'Disabled'; $scope.altStatus2 = 'Disabled'; $scope.altStatus3 = 'Disabled'; 
					$scope.pointSettingData = { empty:3998, full: 400, alert1: '', alert2 : '', alert3 : '', alarmFirstCheck : null, alarmSecondCheck : null, alarmThirdCheck : null };
				} else {
					$scope.alarmCount =  parseInt(($scope.pointSettingData.alert1 )? 1 : 0) + parseInt(($scope.pointSettingData.alert2)? 1 : 0) + parseInt(($scope.pointSettingData.alert3 )? 1 : 0)

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

					if( $scope.pointSettingData.alarmFirstCheck === null ) {
						$scope.addAlt1Class = 'alertLight';
						$scope.disAlt1 = '';						
						$scope.altStatus1 = 'Disabled';
					  } else {
						$scope.addAlt1Class = '';
						$scope.disAlt1 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert1 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100);
						$scope.altStatus1 = '';
					  }
			
					  if( $scope.pointSettingData.alarmSecondCheck === null ) {
						$scope.addAlt2Class = 'alertLight';
						$scope.disAlt2 = '';
						$scope.altStatus2 = 'Disabled';
					  } else {
						$scope.addAlt2Class = '';
						$scope.disAlt2 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert2 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100);
						$scope.altStatus2 = '';
					  }
			
					  if( $scope.pointSettingData.alarmThirdCheck === null ) {
						$scope.addAlt3Class = 'alertLight';
						$scope.disAlt3 = '';
						$scope.altStatus3 = 'Disabled';
					  } else {
						$scope.addAlt3Class = '';
						$scope.disAlt3 = Math.round(((( $scope.emptyVal - $scope.fullVal)-($scope.alert3 - $scope.fullVal )) / ($scope.emptyVal - $scope.fullVal)) * 100);
						$scope.altStatus3 = '';
					  }
				}

			}).catch(function(error) {

				if(error.status==401){
					$window.localStorage.removeItem('authToken');
					$rootScope.storage.loggedIn = false;
					$rootScope.storage.authToken = false;
					$rootScope.storage.$reset();
					$scope.refreshPage();
					$state.go('login');
				}

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
		}
	}
	
	/* Starts: This function is for fetching portal Names*/ 
	function getUserPoratData() {
		$http.get($scope.serverRequest+'getAllPortal', { headers : customeHeader }).then(function (result) {
			$scope.portal = result.data.data;
			$scope.selectedPortal = $scope.portal[0];
			if( $scope.selectedPortal.id_name != "Select One") 
				selectedGroupNode($scope.selectedPortal.id_name);
				loadProductsIMEI($scope.selectedPortal.id_name);		
			
			$scope.newPortal = result.data.data;
			$scope.selectedNewPortal = $scope.portal[0];
			$scope.newPortalData = function(){
				if( $scope.selectedNewPortal.id_name != "Select One") 
				selectedNewGroupNode($scope.selectedNewPortal.id_name);
			}
		}).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          });
	}

	getUserPoratData();
	/* ends */ 

	/**function to get Group Node options*/ 
	function selectedGroupNode(newPortalName)  {
		$scope.isLoading = true;
		$http.get($scope.serverRequest+`groupNode?portal=${newPortalName}`, { headers : customeHeader }).then(function (res) {
			$scope.groupNode = res.data.data;
			$scope.selectedGroup = $scope.groupNode[0];

		}).catch(function(error){
            if(error.status==401){
              $window.localStorage.removeItem('authToken');
              $rootScope.storage.loggedIn = false;
              $rootScope.storage.authToken = false;
              $rootScope.storage.$reset();
              $scope.refreshPage();
              $state.go('login');
            }
          }).finally(function() {
			$scope.isLoading = false;
        });
	}
	/*ends*/

	function timeZone() {
		$scope.isLoading = true;
		$http.get($scope.serverRequest+`location`, { headers : customeHeader }).then(function (res) {
			$scope.timeZone = res.data.data;
			$scope.selectedTimeZone = $scope.timeZone[0];
			$scope.selectedValue = res.data.data[0]['timezone'];
			
		}).finally(function() {
			$scope.isLoading = false;
        });
	}

	timeZone();

	$scope.textChanged = function() {
        GetAddress($scope.elat , $scope.elan);
    };
	$scope.showRefreshLog = function(){
		$scope.isLoading = true;
		$http.get($scope.serverRequest+`dynamicTable/${$scope.serialName}`, { headers : customeHeader }).then(function (result) {
			const response = result.data.data;
			var convertedData = [];

			for (var i = 0; i < response.length; i++) {
				var data = response[i];

				const inputDateString = data.date;
				const ttemp = convertDateStringToISOString(inputDateString);
				const singaporeTime = moment(ttemp).tz("Asia/Singapore");
				var timee = singaporeTime.format("h:mm:ss A");
				var datee = singaporeTime.format("ddd, MMMM Do YYYY");
				
				var formattedDate = `${datee}, ${timee} `
				var distanceValue = "";
				if( data.height <= 400)
				    distanceValue = 400;
				else if( data.height >= 3998 )
					distanceValue = "";
				else 
				    distanceValue = parseInt(data.height);
				var convertedPoint = { 
					date: formattedDate,
					height: distanceValue,
					angle: data.angle,
					temperature: data.temperature, 
					signalStrengthValue: parseInt(data.signal_strength), 
					
				};
				convertedData.push(convertedPoint);
			}
			$scope.tableData = convertedData;
		}).finally(function() {
			$scope.isLoading = false;
		});
	}

	$scope.closeModal = function () {
		$scope.showModal = false;
	};
	$scope.showModall = function () {
		
		if($scope.selectedProductImei.prod_data == 'TracNet IMEI'){
			alert('Please select any Product IMEI..')
			return;
		}
		if($scope.tableData == ''){
			alert("Data not present...")
			return;
		}
		$scope.showModal = true;
	};

	$scope.getPorudctImages = function(productId){
		const query = $scope.serverRequest+`getAllImages/` + productId;

		$http.get(query, { headers : customeHeader }).then(function (result) {
			
			$scope.imagesData = result.data.data;
		});
	}
	
	/*Save Manhole Specifications*/
	$scope.manholeSpecificationsformData = function() {
		const enabled = 1;
        var node_name = localStorage.getItem("node_name");
        var val = angular.element($(".alertNumber")).val();
        var alertF = parseInt(angular.element($('#alert1')).val());
        var alertS = parseInt(angular.element($('#alert2')).val());
        var alertT = parseInt(angular.element($('#alert3')).val());
        
        if( $scope.showAlert1 == true ) {
          $scope.alert1 = alertF;
          $scope.alarmFirstCheck = enabled;	
        }  else {
          $scope.alert1 = null;
          $scope.alarmFirstCheck = null;	
        }
        
        if( $scope.showAlert2 == true ) {
          $scope.alert2 = alertS;
          $scope.alarmSecondCheck = enabled;	
        } else {
          $scope.alert2 = null;
          $scope.alarmSecondCheck = null;
        }
        
        if( $scope.showAlert3 == true) {
          $scope.alert3 = alertT;
          $scope.alarmThirdCheck = enabled;	
        } else {
          $scope.alert3 = null;
          $scope.alarmThirdCheck = null;
        }
        /* disable button starts*/ 
        if( $scope.disableBtn ==  true) { 
          if( $scope.alert1 != null ) {
            if( $scope.alert1Check != 'undefined' && $scope.alert1Check == 0) {
              $scope.alarmFirstCheck = 1;
            } else {
              $scope.alarmFirstCheck = 0;
            }
          } 
          // else {
          // 	$scope.alert1 = null;
          // 	$scope.alarmFirstCheck = null;
          // }
          if( $scope.alert2 != null ) {
            if( $scope.alert2Check != 'undefined' && $scope.alert2Check == 0) {
              $scope.alarmSecondCheck = 1;
            } else {
              $scope.alarmSecondCheck = 0;
            }
          } 
          // else {
          // 	$scope.alert2 = null;
          // 	$scope.alarmSecondCheck = null;
          // }
          if( $scope.alert3 != null ) {
            if( $scope.alert3Check != 'undefined' && $scope.alert3Check == 0) {
              $scope.alarmThirdCheck = 1;
            } else {
              $scope.alarmThirdCheck = 0;
            }
          } 
          // else {
          // 	$scope.alert3 = null;
          // 	$scope.alarmThirdCheck = null;
          // }
        }
        /* diable button ends*/ 
        /** delete button starts*/
        if( $scope.deleteBtn ==  true) { 
          $scope.alert1 = null;
          $scope.alarmFirstCheck = null;

          $scope.alert2 = null;
          $scope.alarmSecondCheck = null;

          $scope.alert3 = null;
          $scope.alarmThirdCheck = null;
        }
        /** delete button ends*/
        $scope.fullValue = angular.element($('#fullValue')).val();
        $scope.emptyValue = angular.element($('#emptyValue')).val();
        if( !$scope.fullValue || !$scope.emptyValue){
          alert("Setting Boundaries are Required")
          return;
        }

			$scope.alertFormSubmitdata = {
				"pointId": localStorage.getItem("pointId"),
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
			}

			$rootScope.storage.sendFormData = $scope.alertFormSubmitdata;
			const data = $rootScope.storage.sendFormData;
			$http.post($scope.serverRequest + 'add-user-definded-distancealert', data, { headers : customeHeader }).then(function(response) {
				var responseStatus = response.data.status;
				alert("Record Updated!")
				$scope.showModal = false;
				dynamicTableData($scope.selectedProductImei.prod_data.split('-')[0].replace(/[\s]/g, ''));

			}).finally(function() {
				$scope.isLoading = false;
			});
		}

});




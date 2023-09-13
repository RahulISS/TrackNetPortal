angular.module('mainCtrl', [])

    .controller('mainController', function ($scope, $rootScope, $http, $state, $q, Data, $location, apiBaseUrl, $window) {
        $rootScope.storage.toggle = false;
        $scope.serverRequest = apiBaseUrl;
        const token = localStorage.getItem("authToken");
        const customeHeader = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        if (localStorage.getItem("authToken") == '' || localStorage.getItem("authToken") == undefined) {
            $state.go('login');
            return;
        }

        $scope.thisyear = new Date().getFullYear();
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();

        $scope.today = yyyy + '-' + mm + '-' + dd;
        var dataTracknet = [];
        $scope.navigationArray = [{
            name: 'Home',
            link: 'home'
        },
        {
            name: 'Charts',
            link: 'charts'
        },
        {
            name: 'TracNet',
            link: 'tracnet'
        },
        {
            name: 'Settings',
            link: 'settings',
        }
        ];
        if(localStorage.getItem("trackNet") == 'trackNet'){
            $scope.selectedNavIndex = 2;
        }else{
            $scope.selectedNavIndex = 0;
        }
        $state.go('main.' + $scope.navigationArray[$scope.selectedNavIndex].link);

        $scope.changeTemplate = function (index) {
            $scope.selectedNavIndex = index;
            $rootScope.storage.page_index = index;
            $state.go('main.' + $scope.navigationArray[$scope.selectedNavIndex].link);
        }

        //There is a blank value for $rootScope.storage.chartsRangeStartDate in the datepicker
        $scope.refreshPage = function () {
            setTimeout(function () {
                window.location.reload();
            }, 50);
        }

        $scope.signOut = function () {
            const query = $http.get(apiBaseUrl + 'logout', { headers: customeHeader })
                .then(function (response) {
                    $window.localStorage.removeItem('authToken');
                    $rootScope.storage.loggedIn = false;
                    $rootScope.storage.authToken = false;
                    $rootScope.storage.$reset();
                    $scope.refreshPage();
                    $state.go('login');
                }).catch(function (err) { // Corrected the syntax here
                    $window.localStorage.removeItem('authToken');
                    $rootScope.storage.loggedIn = false;
                    $rootScope.storage.authToken = false;
                    $rootScope.storage.$reset();
                    $scope.refreshPage();
                    $state.go('login');
                });

        }

        // let sensors = [];

        $rootScope.loadTree = function () {
            const query = $http.get(apiBaseUrl + 'chart', { headers: customeHeader })
                .then(function (response) {
                    const data = response.data.data;
                    let flatArray = [{
                        'aTreeNodeRef': null,
                        'aTreeRef': '64ad1d5d664396439a286281',
                        'text': 'Trial Network',
                        'a_attr': { 'title': 'Trial Network' },
                        '_id': '64ae5888efa8baae8f106baf',
                    }];
                    for (let i = 0; i < data.length; i++) {
                        let dict = {
                            'aTreeNodeRef': data[i].aTreeNodeRef,
                            'aTreeRef': data[i].aTreeRef,
                            'text': data[i].textLabel,
                            'a_attr': { 'title': data[i].textMouseRollover },
                            '_id': data[i]._id,
                        }
                        flatArray.push(dict);
                    }
                    let tree = [];
                    const idMapping = flatArray.reduce((acc, el, i) => {
                        if (el._id !== undefined) {
                            acc[el._id] = i;

                        }
                        return acc;
                    }, {});
                    // const idMapping = flatArray.reduce((acc, el, i) => {
                    //     //console.log(_id,'el._id')
                    //     acc[el._id] = i;
                    //     //console.log(acc,'acc')
                    //     return acc;
                    // }, {});

                    flatArray.forEach(el => {
                        let temp_tree;
                        if (el.aTreeNodeRef === null) {
                            temp_tree = el;
                            tree.push(temp_tree);
                            return;
                        }
                        const parentIndex = idMapping[el.aTreeNodeRef];
                        if (typeof parentIndex !== 'undefined') {
                            const parentEl = flatArray[parentIndex];
                            parentEl['children'] = [...(parentEl['children'] || []), el];
                        }
                    });

                    let queriesArray = [];
                    if (!tree) {
                        tree.forEach(sub => {
                            sub.children.forEach(subSub => {
                                subSub.children.forEach(el => {
                                    queriesArray.push({
                                        'index': el._id,
                                        'query': apiBaseUrl + `atreenode-ref?productRef=${el._id}`
                                    });
                                });
                            });
                        });
                    }
                    const promises_data = queriesArray.map(function (item) {
                        return $http.get(query, { headers: customeHeader })
                            .then(function (reqResult) {
                                //console.log(reqResult.data,'reqResult.data sorb')
                                return {
                                    'idx': item.index,
                                    'data': reqResult.data.data
                                };
                            });
                    });
                    $q.all(promises_data).then(function (responses) {
                        if (responses.length !== queriesArray.length) return;
                        getSensors(tree);
                        $rootScope.storage.treeData = tree;
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

        $rootScope.$on("checkedRef", function (e, data) {
            checkedRefData(e, data);
            $scope.$apply();
        });

        if ($rootScope.storage.treeData.length === 0) {
            $rootScope.loadTree();
        }
        $rootScope.loadTree();
        $scope.toggleMenu = function () {
            $scope.toggle = !$scope.toggle;
            $rootScope.storage.toggle = $scope.toggle;
        }

        function checkedRefData(e, edata) {
            let sensors = [];
            const query2 = $http.get(apiBaseUrl + 'sensortList', { headers: customeHeader })
                .then(function (response) {
                    const data = response.data.data
                    let sensors = [{
                        'id': '64ae522eefa8baae8f106b9d',
                        'unit': '%',
                        'id_name': 'Relative Distance',
                        'rank': 1,
                        'checked': false,
                    }];
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].unit != "1") {
                            sensors.push({
                                'id': data[i]._id,
                                'unit': data[i].unit,
                                'id_name': data[i].id_name,
                                'rank': data[i].rank,
                                'checked': false,
                            })
                        }
                    }
                    $rootScope.storage.sensorData = sensors;
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

        function getSensors(tree) {
            for (let i = 0; i < tree.length; i++) {
                if (tree[i].children) {
                    getSensors(tree[i].children);
                } else {
                    getSensorsForNode(tree[i], callback);
                }
            }
        }

        function callback(obj, data) {
            obj['sensors'] = data;
        }

        function getSensorsForNode(obj, callback) {
            callback(obj, $rootScope.storage.sensorData);
        }

    })

/*
Chart Utility Functions
*/

const boolValueDict = {
    'Flow Switch': { 'FALSE': 'OFF', 'TRUE': 'ON', 0: 'OFF', 1: 'ON' },
    'Door Switch': { 'FALSE': 'OPEN', 'TRUE': 'CLOSED', 0: 'OPEN', 1: 'CLOSED' },
    'Flow Valve': { 'FALSE': 'CLOSED', 'TRUE': 'OPEN', 0: 'CLOSED', 1: 'OPEN' },
}

function tooltipFormaterFunction(obj, sensType, measurement) {
    const seriesName = obj.points[0].series.name;
    const seriesColor = obj.points[0].color;
    if (sensType === 'Bool') {
        let state;
        if (obj.y == 1) {
            state = boolValueDict[measurement][1];
        } else {
            state = boolValueDict[measurement][0];
        }
        return `<span style="font-size: 10px">${moment.utc(obj.x).format("D/M/YYYY h:mma")}</span><br/>
        <span style="color:${seriesColor}">${seriesName}</span><b>: ${state}</b><br/>`;
    } else {
        let tooltip = `<span style="font-size:10px;">${moment.utc(obj.x).format("D/M/YYYY h:mma")}</span><br/>`
        if (obj.points.length > 1) {
            for (let i = 0; i < obj.points.length; i++) {
                tooltip += `<span style="color:${obj.points[i].color}">${obj.points[i].series.name}</span><b>: ${obj.points[i].y}</b><br/>`;
            }
        } else {
            tooltip += `<span style="color:${seriesColor}">${seriesName}</span><b>: ${obj.y}</b>`;
        }
        return tooltip;
    }
}

function tooltipTestFunction(obj, sensType, measurement) {
    const seriesName = obj.points[0].series.name;
    const seriesColor = obj.points[0].color;
    if (sensType === 'Bool') {
        let state;
        if (obj.y == 1) {
            state = boolValueDict[measurement][1];
        } else {
            state = boolValueDict[measurement][0];
        }
        return `<span style="font-size: 10px; color:${seriesColor};">${moment.utc(obj.x).format("D/M/YYYY h:mm:ssa")} ${state}</span><br/>`;
    } else {
        let tooltip = '';
        if (obj.points.length > 1) {
            for (let i = 0; i < obj.points.length; i++) {
                tooltip += `<span style="color:${obj.points[i].color};">${moment.utc(obj.points[i].x).format("D/M/YYYY h:mm:ssa")}</span><b> ${obj.points[i].y}</b><br/>`;
            }
        } else {
            tooltip += `<span style="color:${seriesColor};">${moment.utc(obj.x).format("D/M/YYYY h:mm:ssa")}</span><b> ${obj.y}</b>`;
        }
        return tooltip;
    }
}

function dataPointFormaterFunction(obj, sensorInfo) {
    const seriesName = obj.series.name;
    const seriesColor = obj.series.color;
    if (sensorInfo.kind === 'Bool') {
        let state;
        if (obj.y == 1) {
            state = boolValueDict[sensorInfo.id_name][1];
        } else {
            state = boolValueDict[sensorInfo.id_name][0];
        }
        return `<span style="color:${seriesColor}">${seriesName}</span><b>: ${state}</b><br/>`;

    } else {
        return `<span style="color:${seriesColor}">${seriesName}</span><b>: ${obj.y}</b><br/>`;
    }
}

function yAxisLabelFormaterFunction(obj, sensType, measurement, unit) {
    if (sensType === 'Bool') {
        if (obj.value == 1) {
            state = boolValueDict[measurement][1];
        } else if (obj.value == 0) {
            state = boolValueDict[measurement][0];
        } else {
            state = '';
        }
        return state;
    } else {
        return obj.value + unit;
    }
}
/*
Chart Utility Functions
*/
function getTreeNode(treeid, id) {
    return $(treeid).jstree("get_node", id);
}

function getTreeSelected(treeid) {
    return $(treeid).jstree('get_selected');
}

function inArray(array, key, value) {
    let isUnique = array.some(function (item) {
        if (this[0] === item[key]) { return item; }
    }, [value]);
    return isUnique;
}

function getIndex(array, key, value) {
    let index = array.findIndex(function (item) {
        return item[key] === value;
    });
    return index;
}

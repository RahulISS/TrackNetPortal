if (typeof module !== 'undefined' && typeof exports !== 'undefined' && module.exports === exports) {
  module.exports = 'highcharts-ng';
}
(function (H) {
  'use strict';

  H.wrap(H.Pointer.prototype, 'normalize', function (proceed, e, chartPosition) {
    var newE = proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    return H.extend(newE, {
      rightKey: (((e.buttons || e.button) & 1) === 1 && this.options.chart.zoomType == 'x' && this.chart.resetZoomButton!=undefined && this.options.chart.panning.enabled)
    });
  });

  H.wrap(H.Pointer.prototype, 'onContainerMouseDown', function (proceed, e) {
    this.options.chart.panKey = 'right';
    if( ((e.buttons || e.button) & 1) === 1 ) {
      if(this.options.chart.zoomType == 'x' && this.chart.resetZoomButton!=undefined) {
        this.options.chart.panning.enabled = true;
      } else {
        this.options.chart.zoomType = 'xy';
        this.options.lang.resetZoom = 'Reset Zoom';
        this.options.chart.panning.enabled = false;
      }
    } else {
      this.options.chart.zoomType = 'x';
      this.options.lang.resetZoom = 'Exit Scanning Mode';
      this.options.chart.panning.enabled = false;
    }
    var isPrimaryButton = true;
    // Normalize before the 'if' for the legacy IE (#7850)
    e = this.normalize(e);
    // #11635, Firefox does not reliable fire move event after click scroll
    if (H.isFirefox &&
        e.button !== 0) {
        this.onContainerMouseMove(e);
    }
    // #11635, limiting to primary button (incl. IE 8 support)
    if (typeof e.button === 'undefined' ||
        isPrimaryButton) {
        this.zoomOption(e);
        // #295, #13737 solve conflict between container drag and chart zoom
        if (isPrimaryButton &&
            e.preventDefault) {
            e.preventDefault();
        }
        this.dragStart(e);
    }
  });

  H.addEvent(H.Chart, 'render', function(e) {
    const chart = e.target;
    H.addEvent(chart.container, 'contextmenu', function(e) {
      e.preventDefault();
    });
    H.addEvent(chart.container, 'mouseenter', function(e) {
      if(chart.resetZoomButton!=undefined) chart.resetZoomButton.show();
    });
    H.addEvent(chart.container, 'mouseleave', function(e) {
      if(chart.resetZoomButton!=undefined) chart.resetZoomButton.hide();
    });
    if(chart.resetZoomButton!=undefined) {
      chart.resetZoomButton.textSetter(chart.options.lang.resetZoom);
      chart.resetZoomButton.align(chart.options.chart.resetZoomButton.position, false, 'scrollablePlotBox');
    }
  });

  /*global angular: false, Highcharts: false */
  angular.module('highcharts-ng', []).factory('highchartsNGUtils', highchartsNGUtils).directive('highchart', [
    'highchartsNGUtils',
    '$timeout',
    highchart
  ]);
  function highchartsNGUtils() {
    return {
      indexOf: function (arr, find, i) {
        if (i === undefined)
          i = 0;
        if (i < 0)
          i += arr.length;
        if (i < 0)
          i = 0;
        for (var n = arr.length; i < n; i++)
          if (i in arr && arr[i] === find)
            return i;
        return -1;
      },
      prependMethod: function (obj, method, func) {
        var original = obj[method];
        obj[method] = function () {
          var args = Array.prototype.slice.call(arguments);
          func.apply(this, args);
          if (original) {
            return original.apply(this, args);
          } else {
            return;
          }
        };
      },
      deepExtend: function deepExtend(destination, source) {
        //Slightly strange behaviour in edge cases (e.g. passing in non objects)
        //But does the job for current use cases.
        if (angular.isArray(source)) {
          destination = angular.isArray(destination) ? destination : [];
          for (var i = 0; i < source.length; i++) {
            destination[i] = deepExtend(destination[i] || {}, source[i]);
          }
        } else if (angular.isObject(source)) {
          for (var property in source) {
            destination[property] = deepExtend(destination[property] || {}, source[property]);
          }
        } else {
          destination = source;
        }
        return destination;
      }
    };
  }
  function highchart(highchartsNGUtils, $timeout) {
    // acceptable shared state
    var seriesId = 0;
    var ensureIds = function (series) {
      var changed = false;
      angular.forEach(series, function (s) {
        if (!angular.isDefined(s.id)) {
          s.id = 'series-' + seriesId++;
          changed = true;
        }
      });
      return changed;
    };
    // immutable
    var axisNames = [
        'xAxis',
        'yAxis'
      ];
    var getMergedOptions = function (scope, element, config) {
      var mergedOptions = {};
      var defaultOptions = {
          chart: { events: {} },
          title: {},
          subtitle: {},
          series: [],
          credits: {},
          plotOptions: {},
          navigator: { enabled: false }
        };
      if (config.options) {
        mergedOptions = highchartsNGUtils.deepExtend(defaultOptions, config.options);
      } else {
        mergedOptions = defaultOptions;
      }
      mergedOptions.chart.renderTo = element[0];
      angular.forEach(axisNames, function (axisName) {
        if (angular.isDefined(config[axisName])) {
          mergedOptions[axisName] = angular.copy(config[axisName]);
          if (angular.isDefined(config[axisName].currentMin) || angular.isDefined(config[axisName].currentMax)) {
            highchartsNGUtils.prependMethod(mergedOptions.chart.events, 'selection', function (e) {
              var thisChart = this;
              if (e[axisName]) {
                scope.$apply(function () {
                  scope.config[axisName].currentMin = e[axisName][0].min;
                  scope.config[axisName].currentMax = e[axisName][0].max;
                });
              } else {
                //handle reset button - zoom out to all
                scope.$apply(function () {
                  scope.config[axisName].currentMin = thisChart[axisName][0].dataMin;
                  scope.config[axisName].currentMax = thisChart[axisName][0].dataMax;
                });
              }
            });
            highchartsNGUtils.prependMethod(mergedOptions.chart.events, 'addSeries', function (e) {
              scope.config[axisName].currentMin = this[axisName][0].min || scope.config[axisName].currentMin;
              scope.config[axisName].currentMax = this[axisName][0].max || scope.config[axisName].currentMax;
            });
          }
        }
      });
      if (config.title) {
        mergedOptions.title = config.title;
      }
      if (config.subtitle) {
        mergedOptions.subtitle = config.subtitle;
      }
      if (config.credits) {
        mergedOptions.credits = config.credits;
      }
      if (config.size) {
        if (config.size.width) {
          mergedOptions.chart.width = config.size.width;
        }
        if (config.size.height) {
          mergedOptions.chart.height = config.size.height;
        }
      }
      return mergedOptions;
    };
    var updateZoom = function (axis, modelAxis) {
      var extremes = axis.getExtremes();
      if (modelAxis.currentMin !== extremes.dataMin || modelAxis.currentMax !== extremes.dataMax) {
        axis.setExtremes(modelAxis.currentMin, modelAxis.currentMax, false);
      }
    };
    var processExtremes = function (chart, axis, axisName) {
      if (axis.currentMin || axis.currentMax) {
        chart[axisName][0].setExtremes(axis.currentMin, axis.currentMax, true);
      }
    };
    var chartOptionsWithoutEasyOptions = function (options) {
      return angular.extend({}, options, {
        data: null,
        visible: null
      });
    };
    return {
      restrict: 'EAC',
      replace: true,
      template: '<div></div>',
      scope: {
        config: '=',
        disableDataWatch: '='
      },
      link: function (scope, element, attrs) {
        // We keep some chart-specific variables here as a closure
        // instead of storing them on 'scope'.
        // prevSeriesOptions is maintained by processSeries
        var prevSeriesOptions = {};
        var processSeries = function (series) {
          var i;
          var ids = [];
          if (series) {
            var setIds = ensureIds(series);
            if (setIds) {
              //If we have set some ids this will trigger another digest cycle.
              //In this scenario just return early and let the next cycle take care of changes
              return false;
            }
            //Find series to add or update
            angular.forEach(series, function (s) {
              ids.push(s.id);
              var chartSeries = chart.get(s.id);
              if (chartSeries) {
                if (!angular.equals(prevSeriesOptions[s.id], chartOptionsWithoutEasyOptions(s))) {
                  chartSeries.update(angular.copy(s), false);
                } else {
                  if (s.visible !== undefined && chartSeries.visible !== s.visible) {
                    chartSeries.setVisible(s.visible, false);
                  }
                  chartSeries.setData(angular.copy(s.data), false);
                }
              } else {
                chart.addSeries(angular.copy(s), false);
              }
              prevSeriesOptions[s.id] = chartOptionsWithoutEasyOptions(s);
            });
            //  Shows no data text if all series are empty
            if (scope.config.noData) {
              var chartContainsData = false;
              for (i = 0; i < series.length; i++) {
                if (series[i].data && series[i].data.length > 0) {
                  chartContainsData = true;
                  break;
                }
              }
              if (!chartContainsData) {
                chart.showLoading(scope.config.noData);
              } else {
                chart.hideLoading();
              }
            }
          }
          //Now remove any missing series
          for (i = chart.series.length - 1; i >= 0; i--) {
            var s = chart.series[i];
            if (s.options.id !== 'highcharts-navigator-series' && highchartsNGUtils.indexOf(ids, s.options.id) < 0) {
              s.remove(false);
            }
          }
          return true;
        };
        // chart is maintained by initChart
        var chart = false;
        var initChart = function () {
          if (chart)
            chart.destroy();
          prevSeriesOptions = {};
          var config = scope.config || {};
          var mergedOptions = getMergedOptions(scope, element, config);
          var func = config.func || undefined;
          chart = config.useHighStocks ? new Highcharts.StockChart(mergedOptions, func) : new Highcharts.Chart(mergedOptions, func);
          for (var i = 0; i < axisNames.length; i++) {
            if (config[axisNames[i]]) {
              processExtremes(chart, config[axisNames[i]], axisNames[i]);
            }
          }
          if (config.loading) {
            chart.showLoading();
          }
          config.getHighcharts = function () {
            return chart;
          };
        };
        initChart();
        if (scope.disableDataWatch) {
          scope.$watchCollection('config.series', function (newSeries, oldSeries) {
            processSeries(newSeries);
            chart.redraw();
          });
        } else {
          scope.$watch('config.series', function (newSeries, oldSeries) {
            var needsRedraw = processSeries(newSeries);
            if (needsRedraw) {
              chart.redraw();
            }
          }, true);
        }
        scope.$watch('config.title', function (newTitle) {
          chart.setTitle(newTitle, true);
        }, true);
        scope.$watch('config.subtitle', function (newSubtitle) {
          chart.setTitle(true, newSubtitle);
        }, true);
        scope.$watch('config.loading', function (loading) {
          if (loading) {
            chart.showLoading();
          } else {
            chart.hideLoading();
          }
        });
        scope.$watch('config.credits.enabled', function (enabled) {
          if (enabled) {
            chart.credits.show();
          } else if (chart.credits) {
            chart.credits.hide();
          }
        });
        scope.$watch('config.useHighStocks', function (useHighStocks, oldUseHighStocks) {
          if (useHighStocks === oldUseHighStocks)
            return;
          initChart();
        });
        angular.forEach(axisNames, function (axisName) {
          scope.$watch('config.' + axisName, function (newAxes, oldAxes) {
            if (newAxes === oldAxes)
              return;
            if (newAxes) {
              chart[axisName][0].update(newAxes, false);
              updateZoom(chart[axisName][0], angular.copy(newAxes));
              chart.redraw();
            }
          }, true);
        });
        scope.$watch('config.options', function (newOptions, oldOptions, scope) {
          //do nothing when called on registration
          if (newOptions === oldOptions)
            return;
          initChart();
          processSeries(scope.config.series);
          chart.redraw();
        }, true);
        scope.$watch('config.size', function (newSize, oldSize) {
          if (newSize === oldSize)
            return;
          if (newSize) {
            chart.setSize(newSize.width || undefined, newSize.height || undefined);
          }
        }, true);
        scope.$on('highchartsng.reflow', function () {
          chart.reflow();
        });
        scope.$on('$destroy', function () {
          if (chart) {
            chart.destroy();
            $timeout(function () {
              element.remove();
            }, 0);
          }
        });
      }
    };
  }
}(Highcharts));

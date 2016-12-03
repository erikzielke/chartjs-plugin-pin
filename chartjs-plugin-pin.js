/*!
 * chartjs-plugin-pin.js
 * Version: 0.1.0
 *
 * Copyright 2016 Erik Zielke
 * Released under the MIT license
 * https://github.com/erikzielke/chartjs-plugin-pin/blob/master/LICENSE.md
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// Get the chart variable
var Chart = require('chart.js');
Chart = typeof(Chart) === 'function' ? Chart : window.Chart;
var helpers = Chart.helpers;

// Configure plugin namespace
Chart.Pin = Chart.Pin || {};

var DRAW_AFTER = 'afterDraw';
var DRAW_AFTER_DATASETS = 'afterDatasetsDraw';
var DRAW_BEFORE_DATASETS = 'beforeDatasetsDraw';

Chart.Pin.drawTimeOptions = {
    afterDraw: DRAW_AFTER,
    afterDatasetsDraw: DRAW_AFTER_DATASETS,
    beforeDatasetsDraw: DRAW_BEFORE_DATASETS
};

var pinTypes =
    Chart.Pin.types = {
        pin: require('./types/pin.js')(Chart)
    };

// Default plugin options
var pinDefaults =
    Chart.Pin.defaults = {
        drawTime: DRAW_AFTER,
        pins: []
    };

// Default annotation label options
var labelDefaults =
    Chart.Pin.labelDefaults = {
        backgroundColor: 'rgba(0,0,0,0.8)',
        fontFamily: Chart.defaults.global.defaultFontFamily,
        fontSize: Chart.defaults.global.defaultFontSize,
        fontStyle: 'bold',
        fontColor: '#fff',
        xPadding: 6,
        yPadding: 6,
        cornerRadius: 6,
        position: 'center',
        xAdjust: 0,
        yAdjust: 0,
        enabled: false,
        content: null
    };

function drawPins(chartInstance, easingDecimal) {
    if (helpers.isArray(chartInstance.pins)) {
        chartInstance.pins.forEach(function (pin) {
            pin.transition(easingDecimal)
                .draw(chartInstance.chart.ctx);
        });
    }
}

function initConfig(config) {
    config = helpers.configMerge(pinDefaults, config);
    if (helpers.isArray(config.pins)) {
        config.pins.forEach(function (pin) {
            pin.label = helpers.configMerge(labelDefaults, pin.label);
        });
    }
    return config;
}

function buildPins(configs) {
    return configs
        .filter(function (config) {
            return !!pinTypes['pin'];
        })
        .map(function (config, i) {
            var pin = pinTypes['pin'];
            return new pin({
                _index: i,
                config: config
            });
        });
}

var pinPlugin = {
    beforeInit: function (chartInstance) {
        var oldHandleEvent = chartInstance.handleEvent
        chartInstance.handleEvent = function (e) {
            oldHandleEvent.call(chartInstance, e);
            var hasPin = false;
            for (var i = 0; i < chartInstance.pins.length; i++) {
                var pin = chartInstance.pins[i];
                var position = helpers.getRelativePosition(e, chartInstance.chart);
                if (pin.inRange(position.x, position.y)) {
                    hasPin = true;
                    if(e.type == 'click') {
                        if(chartInstance.options.pin.onPinClick) {
                            chartInstance.options.pin.onPinClick(chartInstance, pin);
                        }
                    } else {
                        if(chartInstance.options.pin.onPinHover) {
                            chartInstance.options.pin.onPinHover(chartInstance, pin);
                        }
                    }
                    break
                }
            }
            if(!hasPin) {

                chartInstance.options.pin.onPinHover();
            }

        }
    },
    afterUpdate: function (chartInstance) {
        // Build the configuration with all the defaults set
        var config = chartInstance.options.pin;
        config = initConfig(config || {});

        if (helpers.isArray(config.pins)) {
            chartInstance.pins = buildPins(config.pins);
            chartInstance.pins._config = config;

            chartInstance.pins.forEach(function (pin) {
                pin.configure(pin.config, chartInstance);
            });
        }
    },
    afterDraw: function (chartInstance, easingDecimal) {
        var config = chartInstance.pins._config;
        if (config.drawTime == DRAW_AFTER) {
            drawPins(chartInstance, easingDecimal);
        }
    },
    afterDatasetsDraw: function (chartInstance, easingDecimal) {
        var config = chartInstance.pins._config;
        if (config.drawTime == DRAW_AFTER_DATASETS) {
            drawPins(chartInstance, easingDecimal);
        }
    },
    beforeDatasetsDraw: function (chartInstance, easingDecimal) {
        var config = chartInstance.pins._config;
        if (config.drawTime == DRAW_BEFORE_DATASETS) {
            drawPins(chartInstance, easingDecimal);
        }
    }
};

module.exports = pinPlugin;
Chart.pluginService.register(pinPlugin);

},{"./types/pin.js":3,"chart.js":1}],3:[function(require,module,exports){
// Get the chart variable
var Chart = require('chart.js');
Chart = typeof(Chart) === 'function' ? Chart : window.Chart;
var helpers = Chart.helpers;

// Line Annotation implementation
module.exports = function (Chart) {

    function getBounds(model) {
        return {
            left: model.x - model.width / 2,
            top: model.y - model.width / 2,
            right: model.x + model.width / 2,
            bottom: model.y + model.height / 2
        };
    }

    var Pin = Chart.Element.extend({
        configure: function (options, chartInstance) {

            var image = new Image();
            image.src = options.icon;


            var model = this._model = helpers.clone(this._model) || {};
            model.icon = image;
            var data = chartInstance.chart.config.data;

            var index = data.labels.indexOf(options.position);

            var scale = chartInstance.scales["x-axis-0"];
            var pixel = scale ? scale.getPixelForValue(options.position) : NaN;
            var nextPixel = scale ? scale.getPixelForTick(index + 1) : NaN;

            model.x = pixel;
            model.text = options.icon;

            var max = 0;
            for (var i = 0; i < data.datasets.length; i++) {
                var obj = data.datasets[i].data[index];
                if (obj > max) {
                    max = obj;
                }
            }
            var yAxisScale = chartInstance.scales["y-axis-0"];
            var yPixel = yAxisScale.getPixelForValue(max);

            var nextMax = 0;
            for (var i = 0; i < data.datasets.length; i++) {
                var obj = data.datasets[i].data[index + 1];
                if (obj > nextMax) {
                    nextMax = obj;
                }
            }
            var nextyPixel = yAxisScale.getPixelForValue(nextMax);

            // Figure out the label:
            model.labelBackgroundColor = options.label.backgroundColor;
            model.labelFontFamily = options.label.fontFamily;
            model.labelFontSize = options.label.fontSize;
            model.labelFontStyle = options.label.fontStyle;
            model.labelFontColor = options.label.fontColor;
            model.labelXPadding = options.label.xPadding;
            model.labelYPadding = options.label.yPadding;
            model.labelCornerRadius = options.label.cornerRadius;
            model.labelPosition = options.label.position;
            model.labelXAdjust = options.label.xAdjust;
            model.labelYAdjust = options.label.yAdjust;
            model.labelEnabled = options.label.enabled;
            model.labelContent = options.label.content;
            model.y = yPixel - options.offsetAbove;
            var ctx = chartInstance.chart.ctx;
            ctx.font = helpers.fontString(model.labelFontSize, model.labelFontStyle, model.labelFontFamily);
            model.width = options.width;
            model.height = options.height;
            if (options.offset) {
                var diff = nextPixel - pixel;
                model.x = pixel + (diff * options.offset);

                var diffY = nextyPixel - yPixel;
                model.y = yPixel + (diffY * options.offset) - options.offsetAbove;
            }
        },
        draw: function (ctx) {
            ctx.drawImage(this._model.icon, this._model.x - (this._model.width / 2), this._model.y - this._model.height / 2, this._model.width, this._model.height)
        },
        inRange: function (mouseX, mouseY) {
            var inRange = false;
            if (this._view) {
                var bounds = getBounds(this._model);
                inRange = mouseX >= bounds.left && mouseX <= bounds.right && mouseY >= bounds.top && mouseY <= bounds.bottom;
            }

            return inRange;
        }
    });

    return Pin;
};


},{"chart.js":1}]},{},[2]);

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

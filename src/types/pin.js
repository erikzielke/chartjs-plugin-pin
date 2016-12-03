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


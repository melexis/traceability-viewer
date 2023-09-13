/**
 * @fileoverview This file contains the code for the loader when a query is running.
 */

var start = new Date();
var lines = 16;

/**
 * The loading image.
 */
var loading = function() {
    var w = 200;
    var rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(width / 2, height / 3);
    context.rotate(Math.PI * 2 * rotation);
    for (var i = 0; i < lines; i++) {
        context.beginPath();
        context.rotate(Math.PI * 2 / lines);
        context.moveTo(w / 10, 0);
        context.lineTo(w / 4, 0);
        context.lineWidth = w / 30;
        context.strokeStyle = "rgba(0,0,0," + i / lines + ")";
        context.stroke();
    }
    context.restore();
};
let load;

"use strict";

var gulp = require('gulp'),
    WebpackDevServer = require("webpack-dev-server"),
    webpack = require("webpack"),
    config = require("./webpack.config.js"),
    gutil = require("gulp-util");

gulp.task('webserver', function( callback ) {
    var compiler = webpack(config);
    var server = new WebpackDevServer(compiler, {
        contentBase: "public/",

        hot: false,

        historyApiFallback: true,

        proxy: {
            "*" : { target: 'http://localhost:5000', ws : true }
        },

        headers: { "X-Custom-Header": "yes" },

        stats: { colors: true },

        inline : false

    }).listen(3000, "localhost", function(err ) {

        if(err) throw new gutil.PluginError("webpack-dev-server", err);
        // Server listening
        gutil.log("[webpack-dev-server]", "Build Ok");
    });
});
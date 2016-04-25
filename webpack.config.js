var path = require('path');
var BowerWebpackPlugin = require("bower-webpack-plugin");
var webpack = require("webpack");


const DEBUG = true;
const AUTOPREFIXER_BROWSERS = [
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 35',
    'Firefox >= 31',
    'Explorer >= 9',
    'iOS >= 7',
    'Opera >= 12',
    'Safari >= 7.1'
];

module.exports =  {
    cache: true,
    debug : true,

    stats: {
        colors: true,
        reasons: true,
        hash: true,
        version: true,
        timings: true,
        chunks: true,
        chunkModules: true,
        cached: true,
        cachedAssets: true
    },

    context: path.join(__dirname, 'assets/src'),
    entry: './main',
    output: {
        path: path.join(__dirname, './public'),
        filename: 'bundle.js'
    },

    resolve : {
        root: [],
        alias : {
            createjs: path.resolve("./bower_components/EaselJS/lib/easeljs-0.8.2.combined.js")
        }
    },
    plugins: [
        new BowerWebpackPlugin({
            modulesDirectories: ["bower_components"],
            manifestFiles: ['bower.json', '.bower.json', 'package.json'],
            includes:           /.*/,
            excludes:           [],
            searchResolveModulesDirectories: true
        }),
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery',
            "window.jQuery": "jquery",
            _: 'underscore',
            createjs : "createjs"
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.IgnorePlugin(/vertx/),
        new webpack.DefinePlugin({
            'require.specified': 'require.resolve'
        })
    ],
    module: {
        loaders: [
            // **IMPORTANT** This is needed so that each bootstrap js file required by
            // bootstrap-webpack has access to the jQuery object
            { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
            {
                test: /\.less$/,
                loader: "style!css!less"
            },
            // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
            // loads bootstrap's css.
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=image/svg+xml" }
        ]
    }
};
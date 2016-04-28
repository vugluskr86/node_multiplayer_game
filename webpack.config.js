var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var OpenBrowserPlugin = require('open-browser-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'build');
const APP_DIR = path.resolve(__dirname, 'app');

const DEBUG = (process.env.BUILD_DEV || 'true') === 'true';
const VERBOSE = (process.env.VERBOSE || 'true') === 'true';

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

const GLOBALS = {
    'process.env.NODE_ENV': DEBUG ? '"development"' : '"production"',
    __DEV__: DEBUG
};


const config = {

    cacheDirectory: DEBUG,

    entry: [
        "bootstrap-webpack!./bootstrap.config.js",
        "font-awesome-webpack!./font-awesome.config.js",
        APP_DIR + '/client/main.js'
    ],

    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },

    module : {
        loaders : [
            { test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/
                , loader: 'url?limit=100000&name=[name].[ext]'
            },
            {test: /\.less$/, loader: "style!css!less"},
            {test: /\.css$/, loader: "style-loader!css-loader"}
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template : APP_DIR + '/client/index.html'
        }),
      //  new OpenBrowserPlugin({ url: 'http://test10.tests.onalone.com/webpack-dev-server/' }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        })
    ],

    resolve: {
        root: [ APP_DIR, APP_DIR + '/views'],
        modulesDirectories: ['node_modules'],
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.json']
    },

    cache: DEBUG,
    debug: DEBUG,

    stats: {
        colors: true,
        reasons: DEBUG,
        hash: VERBOSE,
        version: VERBOSE,
        timings: true,
        chunks: VERBOSE,
        chunkModules: VERBOSE,
        cached: VERBOSE,
        cachedAssets: VERBOSE
    }
};

module.exports = config;
var webpack = require('webpack');
var path = require('path');
var fs = require("file-system");

var mods = {};
fs.readdirSync("node_modules")
    .filter(x => [".bin"].indexOf(x) === -1)
    .forEach(mod => {
        mods[mod] = "commonjs " + mod;
    });

var plugins = [];

var config = {
    target: 'node',
    entry: './server.js',
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, '.'),
        filename: '[name].js'
    },
    externals: mods,
    module: {
        loaders: [
            // Support for ES6 modules and the latest ES syntax.
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: "babel"
            },
            { test: /\.json$/, loader: "json" }
        ]
    },
    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },
    plugins: plugins
};

module.exports = config;

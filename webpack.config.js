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
    // devtool: 'source-map',
    output: {
        path: path.join(__dirname, '.'),
        filename: '[name].js'
    },
    externals: mods,
    module: {
        loaders: [
            { test: /\.json$/, loader: "json-loader" }
        ]
    },
    resolveLoader: {
        modules:['node_modules']
    },
    plugins: plugins
};

module.exports = config;

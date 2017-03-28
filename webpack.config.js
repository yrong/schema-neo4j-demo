var webpack = require('webpack');
var path = require('path');
var fs = require("file-system");

var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var mods = {};
fs.readdirSync("node_modules")
    .filter(x => [".bin"].indexOf(x) === -1)
    .forEach(mod => {
        mods[mod] = "commonjs " + mod;
    });

var plugins = [
    new UglifyJSPlugin({
        compress: {
            warnings: false
        },
        output: {
            comments: false
        }
    }),
    new CopyWebpackPlugin([{from:'config',to:'config'},{from:'cypher/initSchema.cyp',to:'cypher/initSchema.cyp'}
    ,{from:'public',to:'public'},{from:'script',to:'script'},{from:'test/*.json'},{from:'node_modules',to:'node_modules'}
    ], {ignore: ['*.gitignore']}),
    new CleanWebpackPlugin(['build'])
];

var config = {
    target: 'node',
    entry: {server:'./server.js',exportJSON:'./export/json/index.js',importExcel:'./import/excel/index.js',importJSON:'./import/json/index.js'},
    // devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js'
    },
    node: {
        __filename: true,
        __dirname: true
    },
    externals: mods,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015']
                    }
                }
            }
        ]
    },
    plugins: plugins
};

module.exports = config;

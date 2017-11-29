const webpack_config = require('webpack-builder-advanced')

let entry = {server:'./app.js'}
const packages = [
    {from:'cypher',to:'cypher',ignore:['*.js']},
    {from:'schema',to:'schema',ignore:['*.js']},
    {from:'search',to:'search',ignore:['*.js']}
]

if(!process.env.EDITION){
    entry = Object.assign(entry,{exportJSON:'./export/json/index.js',importJSON:'./import/json/index.js'})
}
module.exports = webpack_config(entry,packages)





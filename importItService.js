require("babel-core/register");
require("babel-polyfill");
var importer = require("./import/itService.js");

console.time("importITServiceConsuming")
importer().then((result)=>{
    console.timeEnd("importITServiceConsuming")
    process.exit()
})
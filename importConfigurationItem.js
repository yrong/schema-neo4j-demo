require("babel-core/register");
require("babel-polyfill");
var importer = require("./import/configurationItem.js");

console.time("importConfigurationItemConsuming")
importer().then((result)=>{
    console.timeEnd("importConfigurationItemConsuming");
    console.log(JSON.stringify(result))
    process.exit()
})
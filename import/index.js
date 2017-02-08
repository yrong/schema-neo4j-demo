require("babel-core/register");
require("babel-polyfill");
var category = process.argv.slice(2)[0]
var importer = require(`./${category}`);

console.time(category)
importer().then((result)=>{
    console.timeEnd(category)
    console.log(JSON.stringify(result,null,'\t'))
    process.exit()
})
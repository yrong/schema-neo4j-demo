var jsonfile = require('jsonfile')
var _ = require('lodash')
var apiInvoker = require('../helper/apiInvoker')
var dir = process.argv.slice(2)[0]
var file = './data/' + dir + '/services.json'
var items = jsonfile.readFileSync(file)

var cloneArray = (items)=>{
    var clonedItems = new Array(items.length)
    for (var i = 0; i < items.length; i++) {
        clonedItems[i] = _.assign({},items[i])
    }
    return clonedItems
}

var importer = async ()=>{
    let index = 0,pulledItems=cloneArray(items)
    for (let item of items){
        if(item.category==='ITServiceGroup'){
            await apiInvoker.addItServiceGroup(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
    items=cloneArray(pulledItems)
    index = 0
    for (let item of items) {
        if (item.category === 'ITService' && !item.parent &&!item.children&&!item.dependencies&&!item.dependendents) {
            await apiInvoker.addItService(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
    items=cloneArray(pulledItems)
    index = 0
    for (let item of items) {
        if (item.category === 'ITService') {
            await apiInvoker.addItService(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
}

module.exports = importer

if (require.main === module) {
    console.time("importServiceConsuming")
    importer().then((result)=>{
        console.timeEnd("importServiceConsuming");
        process.exit()
    }).catch((err)=>{
        console.log(err)
        process.exit()
    })
}



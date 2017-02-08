var jsonfile = require('jsonfile')
var _ = require('lodash')
var path = require('path')
var config = require('config')
var apiInvoker = require('../helper/apiInvoker')
var cypherInvoker = require('../helper/cypherInvoker')

var cloneArray = (items)=>{
    var clonedItems = new Array(items.length)
    for (var i = 0; i < items.length; i++) {
        clonedItems[i] = _.assign({},items[i])
    }
    return clonedItems
}

var importer = async ()=>{
    let query = `MATCH (n) WHERE n:ITService OR n:ITServiceGroup DETACH DELETE n`
    await cypherInvoker(query, {})
    let date_dir = process.argv.slice(2)[1]
    let file = path.join(config.get('config.export.storeDir'), date_dir,'services.json')
    let items = jsonfile.readFileSync(file)
    let items_undo = cloneArray(items)
    let index = 0,pulledItems=cloneArray(items_undo)
    for (let item of items_undo){
        if(item.category==='ITServiceGroup'){
            await apiInvoker.addItServiceGroup(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
    items_undo=cloneArray(pulledItems)
    index = 0
    for (let item of items_undo) {
        if (item.category === 'ITService' && !item.parent &&!item.children&&!item.dependencies&&!item.dependendents) {
            await apiInvoker.addItService(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
    items_undo=cloneArray(pulledItems)
    index = 0
    for (let item of items_undo) {
        if (item.category === 'ITService') {
            await apiInvoker.addItService(item)
            _.pullAt(pulledItems,index)
            index--
        }
        index++
    }
    return items
}

module.exports = importer




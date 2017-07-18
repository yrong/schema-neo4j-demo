const moment = require('moment')
const _ = require('lodash')
const cypherInvoker = require('../helper/cypherInvoker')
const apiInvoker = require('../helper/apiInvoker')

const run = async ()=>{
    let cypher,result,items,item,expiration_date,patch_item,expired_items=[]
    cypher = `MATCH (n) WHERE n:ConfigurationItem RETURN n`
    result = await cypherInvoker.fromRestful(cypher, {})
    items = result.results[0].data
    items = _.map(items,(item)=>{
        return item.row[0]
    })
    for(item of items){
        if(item&&item.warranty_expiration_date){
            expiration_date = moment(item.warranty_expiration_date)
            if(expiration_date.isBefore(new Date())&&!_.has(item,'expired')){
                expired_items.push(item)
                patch_item = {uuid:item.uuid,expired:true}
                await apiInvoker.addItem('ConfigurationItem',patch_item,true)
            }
        }
    }
    return expired_items
}

module.exports = run


if (require.main === module) {
    run().then((result)=>{
        console.log(JSON.stringify(result,null,'\t'))
        process.exit()
    })
}
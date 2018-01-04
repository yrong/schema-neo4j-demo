const _ = require('lodash')
const config = require('config')
const qr = require('qr-image')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const common = require('scirichon-common')
const schema = require('redis-json-schema')
const scirichon_cache = require('scirichon-cache')
const search = require('../search')


const needNotify = (params,ctx)=>{
    if(ctx.deleteAll || ctx.headers[common.TokenName] === common.InternalTokenId)
        return false
    if(params.jsonImport)
        return false
    let schema_obj = schema.getAncestorSchema(params.category)
    if(schema_obj&&schema_obj.notification)
        return true
}

const stringify2Object = (params) => {
    let objectFields=schema.getSchemaObjectProperties(params.category)
    for(let key of objectFields){
        if(_.isString(params[key])){
            try{
                params[key] = JSON.parse(params[key])
            }catch(error){
                //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
            }
        }
    }
    return params
}

const addNotification = async (params,ctx)=>{
    if(needNotify(params,ctx)){
        let notification_obj = {type:params.category,user:ctx[common.TokenUserName],source:process.env['NODE_NAME']}
        if(ctx.method === 'POST'){
            notification_obj.action = 'CREATE'
            notification_obj.new = stringify2Object(params.fields)
        }
        else if(ctx.method === 'PUT' || ctx.method === 'PATCH'){
            notification_obj.action = 'UPDATE'
            notification_obj.new = stringify2Object(params.fields)
            notification_obj.old = stringify2Object(params.fields_old)
            notification_obj.update = params.change
        }else if(ctx.method === 'DELETE'){
            notification_obj.action = 'DELETE'
            notification_obj.old = stringify2Object(params.fields_old)
        }
        if(params.data&&params.data.notification){
            if(params.data.notification.subscribe_user||params.data.notification.subscribe_role){
                notification_obj.subscribe_user = params.data.notification.subscribe_user||[ctx[common.TokenUserName].uuid]
                notification_obj.subscribe_role = params.data.notification.subscribe_role||ctx[common.TokenUserName].roles
            }
            if(params.data.notification.additional){
                notification_obj.additional = params.data.notification.additional
            }
        }
        await common.apiInvoker('POST',`http://${config.get('privateIP')||'localhost'}:${config.get('notifier.port')}`,'/api/notifications','',notification_obj)
    }
}

const updateCache = async (params,ctx)=>{
    if (ctx.method === 'DELETE'&&ctx.deleteAll) {
        await scirichon_cache.flushAll()
        return
    }
    if (ctx.method === 'POST' || ctx.method === 'PUT' || ctx.method === 'PATCH') {
        await scirichon_cache.addItem(params.fields)
    }
    if (ctx.method === 'DELETE') {
        await scirichon_cache.delItem(params.fields_old)
    }
}

const updateSearch = async (params,ctx)=>{
    if(ctx.method==='POST'||ctx.method==='PUT'||ctx.method==='PATCH'){
        await search.addOrUpdateItem(params,ctx)
    }
    if(ctx.method==='DELETE'){
        await search.deleteItem(params,ctx)
    }
}

const generateQR = async (params,ctx)=>{
    let properties=schema.getSchemaProperties(params.category),qr_code,qr_image_dir
    for(let key in properties){
        if(params.fields[key]&&properties[key].generateQRImage){
            qr_code = qr.image(params.fields[key],{ type: 'png' })
            qr_image_dir = (process.env['RUNTIME_PATH']||'../runtime') + config.get('runtime_data.cmdb.qr_image_dir')
            mkdirp.sync(qr_image_dir)
            qr_code.pipe(fs.createWriteStream(path.join(qr_image_dir,params.fields[key]+'.png')))
        }
    }
}

module.exports = {addNotification,updateCache,updateSearch,generateQR}


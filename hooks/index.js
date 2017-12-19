const _ = require('lodash')
const config = require('config')
const qr = require('qr-image')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const common = require('scirichon-common')
const schema = require('redis-json-schema')
const scirichon_cache = require('scirichon-cache')
const cypherBuilder = require('../cypher/cypherBuilder')
const ScirichonWarning = common.ScirichonWarning
const search = require('../search')
const requestHandler = require('./requestHandler')
const responseHandler = require('./responseHandler')
const logger = require('log4js_wrapper').getLogger()
const cypherInvoker = require('../helper/cypherInvoker')

const needNotify = (params,ctx)=>{
    if(ctx.deleteAll || ctx.headers[common.TokenName] === common.InternalTokenId)
        return false
    if(params.batchImport)
        return false
    let schema_obj = schema.getAncestorSchema(params.category)
    if(schema_obj&&schema_obj.notification)
        return true
}

const addNotification = async (params,ctx)=>{
    if(needNotify(params,ctx)){
        let notification_obj = {type:params.category,user:ctx[common.TokenUserName],source:process.env['NODE_NAME']}
        if(ctx.method === 'POST'){
            notification_obj.action = 'CREATE'
            notification_obj.new = params.fields
        }
        else if(ctx.method === 'PUT' || ctx.method === 'PATCH'){
            notification_obj.action = 'UPDATE'
            notification_obj.new = params.fields
            notification_obj.old = params.fields_old
            notification_obj.update = params.change
        }else if(ctx.method === 'DELETE'){
            notification_obj.action = 'DELETE'
            notification_obj.old = params.fields_old
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

module.exports = {
    cudItem_preProcess: async function (params, ctx) {
        return requestHandler.handleCudRequest(params,ctx)
    },
    cudItem_postProcess:async function (result,params,ctx) {
        if(ctx.method==='POST'||ctx.method==='PUT'||ctx.method==='PATCH'){
            await Promise.all([updateCache(params,ctx),updateSearch(params,ctx),addNotification(params,ctx),generateQR(params,ctx)]).catch((e)=>{
                logger.error(e.stack || e)
                throw new ScirichonWarning(String(e))
            })
        }
        if(ctx.method==='DELETE'){
            if(!ctx.deleteAll&&(!result||(result.length!=1))){
                throw new ScirichonWarning('no record found')
            }
            await Promise.all([updateCache(params,ctx),updateSearch(params,ctx),addNotification(params,ctx)]).catch((e)=>{
                logger.error(e.stack || e)
                throw new ScirichonWarning(String(e))
            })
        }
        return {uuid:params.uuid}||{}
    },
    queryItems_preProcess:function (params,ctx) {
        return requestHandler.handleQueryRequest(params,ctx);
    },
    queryItems_postProcess:async function (result,params,ctx) {
        result = _.isArray(result)&&result.length>0?result[0]:result
        if(result.count>0&&_.isArray(result.results)){
            result.results = await responseHandler.resultMapper(result.results,params,ctx);
        }else{
            result = await responseHandler.resultMapper(result,params,ctx)
        }
        return result
    },
    customizedQueryItems_preProcess:(params,ctx)=>{
        if(params.cypherQueryFile){
            params.cypher = fs.readFileSync(path.resolve(__dirname,'../cypher/'+params.cypherQueryFile + '.cyp'), "utf8")
        }
        requestHandler.logCypher(params)
        return params
    },
    getCategoryInheritanceHierarchy:async function (params,ctx) {
        let schemaInheritanceRelationship = schema.getSchemaHierarchy(params.category),result
        let addSubTypeRelationship = async (relationship)=>{
            result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateQueryInheritHierarchyCypher,{category:relationship.name})
            if(result&&result.length){
                relationship.children = _.map(result,(subtype)=>{
                    return {name:subtype.category}
                })
            }
            if(relationship.children){
                for(let child of relationship.children){
                    await addSubTypeRelationship(child)
                }
            }
        }
        await addSubTypeRelationship(schemaInheritanceRelationship)
        return schemaInheritanceRelationship
    },
    addCategoryInheritanceHierarchy: async function (params,ctx) {
        let result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateInheritRelCypher,params)
        return result
    },
    getCategorySchema:async function(params,ctx) {
        let result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateQueryInheritHierarchyCypher,params)
        return {
            properties:schema.getSchemaProperties(params.category),
            parents:schema.getParentCategories(params.category),
            references:_.uniq(_.map(schema.getSchemaRefProperties(params.category),(attr)=>attr.schema)),
            subtypes:_.map(result,(subtype)=>subtype.category)
        }

    },
    loadSchemas:async function(params, ctx) {
        let schemas = params.data,restart=false
        for(let val of schemas){
            await schema.loadSchema(val,true,true)
            if(val.route)
                restart = true
        }
        if(restart){
            ctx.app.emit('restart')
        }
        return {}
    }
}


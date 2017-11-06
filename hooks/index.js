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
const cypherInvoker = require('../helper/cypherInvoker')
const ScirichonWarning = common.ScirichonWarning
const search = require('../search')
const requestHandler = require('./requestHandler')
const responseHandler = require('./responseHandler')
const logger = require('log4js_wrapper').getLogger()


const needNotify = (params,ctx)=>{
    return !(ctx.deleteAll || params.batchImport || ctx.headers[common.TokenName] === common.InternalTokenId)
}

const addNotification = async (params,ctx)=>{
    if(needNotify(params,ctx)){
        let notification_obj = {type:params.category,user:ctx[common.TokenUserName],source:'cmdb'}
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
    if (ctx.method === 'POST' || ctx.method === 'PUT' || ctx.method === 'PATCH') {
        if (params.uuid)
            await scirichon_cache.set(params.uuid, {
                name: params.fields.name,
                uuid: params.uuid,
                category: params.category
            })
        if (params.name && params.category)
            await scirichon_cache.set(params.category + '_' + params.name, {
                name: params.fields.name,
                uuid: params.uuid,
                category: params.category
            })
    }
    if (ctx.method === 'DELETE') {
        if (params.uuid)
            await scirichon_cache.del(params.uuid)
        if (params.name && params.category)
            await scirichon_cache.del(params.category + '_' + params.name)
        if (ctx.deleteAll)
            await scirichon_cache.flushAll()
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
    let properties=schema.getSchemaProperties(params.category),qr_code,qr_image_dir,qr_image_file
    for(let key in properties){
        if(params.fields[key]&&properties[key].generateQRImage){
            qr_code = qr.image(params.fields[key],{ type: 'png' })
            qr_image_dir = config.get('runtime_data.cmdb.qr_image_dir')
            mkdirp.sync(qr_image_dir)
            qr_image = path.join(qr_image_dir,params.fields[key]+'.png')
            qr_code.pipe(fs.createWriteStream(qr_image))
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
            result.results = await responseHandler.resultMapper(result.results,params);
        }else{
            result = await responseHandler.resultMapper(result,params)
        }
        return result
    },
    customizedQueryItems_preProcess:(params,ctx)=>{
        if(params.cypherQueryFile){
            params.cypher = fs.readFileSync('cypher/'+params.cypherQueryFile + '.cyp', 'utf8')
        }
        requestHandler.logCypher(params)
        return params
    },
    getSchemaHierarchy:async function (params,ctx) {
        let cmdbConfigurationItemInheritanceRelationship = schema.getSchemaHierarchy(params.category),result
        let addSubTypeRelationship = async (relationship)=>{
            if(schema.isSubTypeAllowed(relationship.name)){
                result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQuerySubTypeCypher,{category:relationship.name}, params, true)
                relationship.children = _.map(result,(subtype)=>{
                    return {name:subtype.category}
                })
            }else if(relationship.children){
                if(relationship.children){
                    for(let child of relationship.children){
                        await addSubTypeRelationship(child)
                    }
                }
            }
        }
        await addSubTypeRelationship(cmdbConfigurationItemInheritanceRelationship)
        return cmdbConfigurationItemInheritanceRelationship
    },
    configurationItemCategoryProcess:function(params,ctx) {
        return new Promise((resolve,reject)=>{
            cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQuerySubTypeCypher,params,(result, params)=>{
                resolve({
                    properties:schema.getSchemaProperties(params.category),
                    parents:schema.getParentSchemas(params.category),
                    references:_.uniq(_.map(schema.getSchemaRefProperties(params.category),(attr)=>attr.schema)),
                    subtypes:_.map(result,(subtype)=>subtype.category)
                })
            })
        })
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


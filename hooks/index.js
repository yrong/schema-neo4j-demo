const _ = require('lodash')
const uuid = require('uuid')
const schema = require('../schema')
const config = require('config')
const cypherBuilder = require('../cypher/cypherBuilder')
const LOGGER = require('log4js_wrapper')
const logger = LOGGER.getLogger()
const cmdb_cache = require('scirichon-cache')
const utils = require('../helper/utils')
const cypherInvoker = require('../helper/cypherInvoker')
const ref_converter = require('../helper/converter')
const jp = require('jsonpath')
const common = require('scirichon-common')
const notifier_api_config = config.get('notifier')
const qr = require('qr-image')
const fs = require('fs')
const path = require('path')

const CATEGORY_ALL = 'All'
const getCategoryFromUrl = function (url) {
    let category,key,val,routesDef = schema.getApiRoutes()
    for (key in routesDef){
        val = routesDef[key]
        if(url.includes(val.route)){
            category = key
            break
        }
    }
    if(url.includes('/api/items'))
        category = CATEGORY_ALL
    if(!category)
        throw new Error('can not find category from url:'+url)
    return category;
}

const logCypher = (params)=>{
    logger.debug(`cypher to executed:${JSON.stringify({cypher:params.cyphers||params.cypher,params:_.omit(params,['cypher','cyphers','data','fields_old','method','url','token'])},null,'\t')}`)
}

const cudCypherGenerator = (params)=>{
    if(params.method === 'POST' || params.method === 'PUT' || params.method === 'PATCH'){
        params.cyphers = cypherBuilder.generateAddOrUpdateCyphers(params);
    }
    else if(params.method === 'DELETE')
        params.cypher = cypherBuilder.generateDelNodeCypher(params)
    logCypher(params)
    return params;
}

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',STATUS_ERROR = 'error',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success',
    CONTENT_NODE_USED = 'node already used', DISPLAY_AS_TOAST='toast',DISPLAY_AS_MODAL='modal',DISPLAY_AS_CONSOLE='console';

const paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('perPageSize')},skip;
    if(params.page){
        params.pagination = true
        params.per_page = params.per_page || config.get('perPageSize')
        skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
        if(!schema.isSearchableType(params.category)){
            throw new Error(`${params.category} not support pagination`);
        }
    }
    return _.assign(params,params_pagination);
}

const queryParamsCypherGenerator = function (params) {
    if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(params);
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(params);
    }
    /**
     * customized cypher query
     */
    let member = schema.getMemberType(params.category)
    if(member){
        params.cypher = cypherBuilder.cmdb_queryItemWithMembers_cypher(params.category,member.member,member.attr,params)
    }else if(params.subcategory){
        params.subcategory = params.subcategory.split(",");
        params.cypher = cypherBuilder.generateQueryConfigurationItemBySubCategoryCypher(params);
    }
    logCypher(params)
    return params;
}

const cudItem_params_stringify = async (params) => {
    let objectFields=schema.getSchemaObjectProperties(params.category)
    for (let key in params.fields){
        if(_.isArray(params.fields[key])){
            if(_.isObject(params.fields[key][0])){
                throw new Error('array field can only be of primitive type,invalid field:' + key)
            }
        }
        else if(_.isObject(params.fields[key])){
            if(_.includes(objectFields,key)){
                params.fields[key] = JSON.stringify(params.fields[key])
            }else{
                throw new Error('object field not defined in schema,invalid field:' + key)
            }
        }
    }
    params = _.assign(params, params.fields)
    for(let key of objectFields){
        if(_.isString(params[key])){
             try{
                 params[key] = JSON.parse(params[key])
             }catch(error){
                 //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
             }
        }
    }
}


const cudItem_refParamsConverter = async (params)=>{
    var convert = async (ref,val)=>{
        val = await ref_converter(ref.schema||ref.items.schema,val)
        jp.value(params, `$.${ref.attr}`,val)
        jp.value(params, `$.fields.${ref.attr}`,val)
    }
    var refs = schema.getSchemaRefProperties(params.category)
    if(refs){
        for(let ref of refs){
            let val = jp.query(params, `$.${ref.attr}`)[0]
            if(val){
                await convert(ref,val)
            }
        }
    }
    return params
}

const cudItem_callback = async (params)=>{
    if(params.method === 'POST'||params.method === 'PUT' || params.method === 'PATCH'){
        params = _.assign(params, params.fields)
        await cudItem_refParamsConverter(params)
        await cudItem_params_stringify(params)
    }
    return cudCypherGenerator(params)
}

const constructResponse = (status,content,displayAs)=>{
     return {
        "status":status,
        "message":{
            "content":content,
            "displayAs":displayAs
        }
    }
}

module.exports = {
    cudItem_preProcess: async function (params, ctx) {
        let item_uuid,result,dynamic_field
        params.method = ctx.method,params.user =_.pick(ctx.local,['alias','userid','avatar','roles']),params.token = ctx.token,
            params.url = ctx.url,params.category = params.data?params.data.category:getCategoryFromUrl(params.url)
        if (params.method === 'POST') {
            item_uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
            params.data.fields.uuid = item_uuid
            params.fields = _.assign({}, params.data.fields)
            params.fields.category = params.data.category
            params.fields.created = Date.now()
            dynamic_field = schema.getDynamicSeqField(params.data.category)
            if(dynamic_field){
                result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateSequence(params.data.category), params, true)
                params.fields[dynamic_field] = result[0]
            }
            return await cudItem_callback(params)
        }
        else if (params.method === 'PUT' || params.method === 'PATCH') {
            if(params.uuid){
                result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeCypher(params), params, true)
                if (result && result[0]) {
                    params.fields_old = _.omit(result[0],'id')
                    params.fields = _.assign({}, params.fields_old,params.data.fields)
                    params.fields.lastUpdated = Date.now()
                    params.change = params.data.fields
                    return await cudItem_callback(params, true)
                } else {
                    throw new Error("no record found to patch,uuid or name:" + params.uuid||params.name);
                }
            }else{
                throw new Error('missing uuid when modify')
            }

        } else if (params.method === 'DELETE') {
            if(params.uuid){
                result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeWithRelationToConfigurationItem_cypher(params), params, true)
                if(result&&result[0]&&result[0].self&&result[0].self.category){
                    params.category = result[0].self.category
                    params.name = result[0].self.name
                    params.fields_old = _.omit(result[0].self,'id')
                    if(result[0].items&&result[0].items.length){
                        params[STATUS_ERROR] = CONTENT_NODE_USED
                        params.cypher = cypherBuilder.generateDummyOperation_cypher(params)
                        return params
                    }else{
                        return await cudItem_callback(params)
                    }
                }else{
                    throw new Error("no record found to delete,uuid or name:" + params.uuid||params.name);
                }
            }else if(params.category === CATEGORY_ALL){
                params.cypher = cypherBuilder.generateDelAllCypher();
                return params
            }else{
                throw new Error('missing uuid when delete')
            }
        }
    },
    cudItem_postProcess:async function (result,params,ctx) {
        let response_wrapped = constructResponse(STATUS_INFO,CONTENT_OPERATION_SUCESS,DISPLAY_AS_TOAST),notification_obj
        if(params.method==='POST'||params.method==='PUT'||params.method==='PATCH'){
            if(!params.uuid||!params.fields)
                throw new Error('added obj without uuid')
            await cmdb_cache.set(params.uuid,{name:params.fields.name,uuid:params.uuid,category:params.category})
            if(params.name)
                await cmdb_cache.set(params.category+'_'+params.name,{name:params.fields.name,uuid:params.uuid,category:params.category})
            response_wrapped.uuid = params.uuid
            let properties=schema.getSchemaProperties(params.category)
            for(let key in properties){
                if(params.fields[key]&&properties[key].generateQRImage){
                    let qr_code = qr.image(params.fields.asset_id,{ type: 'png' })
                    let qr_image = path.join('public/upload/QRImage',params.fields.asset_id+'.png')
                    let qr_output = fs.createWriteStream(qr_image)
                    qr_code.pipe(qr_output)
                }
            }
        }
        if(params.method==='DELETE'){
            if(params.uuid){
                response_wrapped.uuid = params.uuid
                if(result&&(result.length==1||result.deleted==1)){
                    if(!params[STATUS_ERROR]){
                        await cmdb_cache.del(params.uuid)
                        if(params.name&&params.category){
                            await cmdb_cache.del(params.category+'_'+params.name)
                        }
                    }
                }else{
                    params[STATUS_WARNING] = params[STATUS_WARNING]||CONTENT_NO_RECORD
                }
            }
            if(params.category===CATEGORY_ALL)
                await cmdb_cache.flushAll()
        }
        response_wrapped.status = params[STATUS_ERROR]?STATUS_ERROR:params[STATUS_WARNING]?STATUS_WARNING:STATUS_INFO
        response_wrapped.message.content = params[STATUS_ERROR]||params[STATUS_WARNING]||CONTENT_OPERATION_SUCESS
        response_wrapped.message.displayAs = params[STATUS_ERROR]?DISPLAY_AS_MODAL:params[STATUS_WARNING]?DISPLAY_AS_CONSOLE:DISPLAY_AS_TOAST
        if(!params[STATUS_ERROR]){
            notification_obj = {type:params.category,user:params.user,token:params.token,source:'cmdb'}
            if(params.method === 'POST'){
                notification_obj.action = 'CREATE'
                notification_obj.new = params.fields
            }
            else if(params.method === 'PUT' || params.method === 'PATCH'){
                notification_obj.action = 'UPDATE'
                notification_obj.new = params.fields
                notification_obj.old = params.fields_old
                notification_obj.update = params.change
            }else if(params.method === 'DELETE'){
                notification_obj.action = 'DELETE'
                notification_obj.old = params.fields_old
            }
            if(params.category!==CATEGORY_ALL)
                await common.apiInvoker('POST',notifier_api_config.base_url,'','',notification_obj)
        }
        return　response_wrapped;
    },
    queryItems_preProcess:function (params,ctx) {
        params.method = ctx.method,params.url = ctx.url,params.category = getCategoryFromUrl(ctx.url)
        params = paginationParamsGenerator(params);
        params = queryParamsCypherGenerator(params);
        return params;
    },
    customizedQueryItems_preProcess:(params,ctx)=>{
        params.method = ctx.method,params.url = ctx.url,params.category = getCategoryFromUrl(ctx.url)
        if(params.cypherQueryFile){
            params.cypher = fs.readFileSync('cypher/'+params.cypherQueryFile + '.cyp', 'utf8')
        }
        return params
    },
    queryItems_postProcess:async function (result,params,ctx) {
        let response_wrapped = constructResponse(STATUS_OK,CONTENT_QUERY_SUCESS,DISPLAY_AS_TOAST)
        result = _.isArray(result)&&result.length>0?result[0]:result;
        if(!result||result.total==0||result.count==0||result.length==0){
            response_wrapped.message.content = CONTENT_NO_RECORD;
            return response_wrapped;
        }
        if(!params.origional){
            if(result.count>0&&_.isArray(result.results)){
                result.results = await utils.resultMapper(result.results,params);
            }else{
                result = await utils.resultMapper(result,params);
            }
        }
        response_wrapped.data = result;
        return response_wrapped;
    },
    getSchemaHierarchy:async function (params,ctx) {
        let response_wrapped = constructResponse(STATUS_OK,CONTENT_OPERATION_SUCESS,DISPLAY_AS_TOAST),result
        let cmdbConfigurationItemInheritanceRelationship = schema.getSchemaHierarchy(params.category)
        let addSubTypeRelationship = async (relationship)=>{
            if(schema.isSubTypeAllowed(relationship.name)){
                result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQuerySubTypeCypher,{category:relationship.name}, params, true)
                relationship.children = _.map(result,(subtype)=>{
                    return subtype.category
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
        response_wrapped.data = cmdbConfigurationItemInheritanceRelationship;
        return response_wrapped
    },
    configurationItemCategoryProcess:function(params,ctx) {
        return new Promise((resolve,reject)=>{
            let response_wrapped = constructResponse(STATUS_OK,CONTENT_OPERATION_SUCESS,DISPLAY_AS_TOAST)
            cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQuerySubTypeCypher,params,(result, params)=>{
                response_wrapped.data = {
                    parents:schema.getParentCategories(params.category),
                    references:_.uniq(_.map(schema.getSchemaRefProperties(params.category),(attr)=>attr.schema)),
                    subtypes:_.map(result,(subtype)=>subtype.category)
                }
                resolve(response_wrapped)
            })
        })
    },
    getCategoryFromUrl:getCategoryFromUrl,
    getSchemaPropertiesProcess:function(params,ctx) {
        let response_wrapped = constructResponse(STATUS_OK,CONTENT_OPERATION_SUCESS,DISPLAY_AS_TOAST)
        response_wrapped.data = schema.getSchemaProperties(params.category)
        return response_wrapped
    },
    STATUS_WARNING,
    loadSchemas:async function(params, ctx) {
        let response_wrapped = constructResponse(STATUS_OK,CONTENT_OPERATION_SUCESS,DISPLAY_AS_TOAST),schemas = params.data,restart=false
        for(let val of schemas){
            await schema.loadSchema(val,true,true)
            if(val.route)
                restart = true
        }
        if(restart){
            response_wrapped.message.additional = 'restart process required'
            ctx.app.emit('restart')
        }
        response_wrapped.data = {}
        return response_wrapped
    },
    CATEGORY_ALL
}


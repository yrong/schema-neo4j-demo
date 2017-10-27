const _ = require('lodash')
const uuid = require('uuid')
const schema = require('redis-json-schema')
const config = require('config')
const cypherBuilder = require('../cypher/cypherBuilder')
const LOGGER = require('log4js_wrapper')
const logger = LOGGER.getLogger()
const scirichon_cache = require('scirichon-cache')
const utils = require('../helper/utils')
const cypherInvoker = require('../helper/cypherInvoker')
const ref_converter = require('../helper/converter')
const jp = require('jsonpath')
const common = require('scirichon-common')
const notifier_api_config = config.get('notifier')
const qr = require('qr-image')
const fs = require('fs')
const path = require('path')
const ScirichonError = common.ScirichonError
const ScirichonWarning = common.ScirichonWarning

const getCategoryFromUrl = function (ctx) {
    let category,key,val,routesDef = schema.getApiRoutesAll()
    for (key in routesDef){
        val = routesDef[key]
        if(ctx.url.includes(val.route)){
            category = key
            break
        }
    }
    if(ctx.url.includes('/api/items')&&ctx.method==='DELETE')
        ctx.deleteAll = true
    if(!ctx.deleteAll&&!category)
        throw new ScirichonError('can not find category from url:'+url)
    return category;
}

const logCypher = (params)=>{
    logger.debug(`cypher to executed:${JSON.stringify({cypher:params.cyphers||params.cypher,params:_.omit(params,['cypher','cyphers','data','fields_old','method','url','token'])},null,'\t')}`)
}

const paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('perPageSize')},skip;
    if(params.page){
        params.pagination = true
        params.per_page = params.per_page || config.get('perPageSize')
        skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
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
        params.cypher = cypherBuilder.generateQueryItemWithMembersCypher(params.category,member.member,member.attr,params)
    }else if(params.subcategory){
        params.subcategory = params.subcategory.split(",");
        params.cypher = cypherBuilder.generateQueryItemByCategoryCypher(params);
    }
    logCypher(params)
    return params;
}

const cudItem_params_stringify = async (params) => {
    let objectFields=schema.getSchemaObjectProperties(params.category)
    for (let key in params.fields){
        if(!_.isArray(params.fields[key])&&_.isObject(params.fields[key])){
            if(_.includes(objectFields,key)){
                params.fields[key] = JSON.stringify(params.fields[key])
            }else{
                throw new ScirichonError('object field not defined in schema,invalid field:' + key)
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

const cudItem_callback = async (params,ctx)=>{
    if(ctx.method === 'POST'||ctx.method === 'PUT' || ctx.method === 'PATCH'){
        params = common.pruneEmpty(params)
        params = _.assign(params, params.fields)
        if(!params.batchImport)
            await cudItem_refParamsConverter(params)
        await cudItem_params_stringify(params)
        params.cyphers = cypherBuilder.generateAddOrUpdateCyphers(params);
    }
    else if(ctx.method === 'DELETE')
        params.cypher = cypherBuilder.generateDelNodeCypher(params)
    logCypher(params)
    return params
}

const checkReferenced = (uuid,items)=>{
    let referenced = false
    for(let item of items){
        if(!referenced){
            let objectFields=schema.getSchemaObjectProperties(item.category)
            for(let key of objectFields){
                if(_.isString(item[key])){
                    try{
                        item[key] = JSON.parse(item[key])
                    }catch(error){
                        //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
                    }
                }
            }
            let refProperties = schema.getSchemaRefProperties(item.category)
            for(let refProperty of refProperties){
                let key = refProperty.attr
                let val = jp.query(item, `$.${key}`)[0]
                if(uuid==val||(_.isArray(val)&&_.includes(val,uuid))){
                    referenced = true
                    break
                }
            }
        }
    }
    return referenced
}

const addNotification = async (params,ctx)=>{
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
    await common.apiInvoker('POST',notifier_api_config.base_url,'','',notification_obj)
}

const needNofify = (params,ctx)=>{
    if(ctx.deleteAll || params.batchImport || ctx.headers[common.TokenName] === common.InternalTokenId )
        return false
    let token_user = ctx[common.TokenUserName]
    if(!token_user)
        return false
    return true
}

module.exports = {
    cudItem_preProcess: async function (params, ctx) {
        let item_uuid,result,dynamic_field
        params.category = params.data?params.data.category:getCategoryFromUrl(ctx)
        if (ctx.method === 'POST') {
            item_uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
            params.data.fields.uuid = item_uuid
            params.fields = _.assign({}, params.data.fields)
            params.fields.category = params.data.category
            params.fields.created = Date.now()
            dynamic_field = schema.getDynamicSeqField(params.data.category)
            if(dynamic_field){
                result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateSequence(params.data.category), params, true)
                params.fields[dynamic_field] = String(result[0])
            }
            return await cudItem_callback(params,ctx)
        }
        else if (ctx.method === 'PUT' || ctx.method === 'PATCH') {
            if(params.uuid){
                result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeCypher(params), params, true)
                if (result && result[0]) {
                    params.fields_old = _.omit(result[0],'id')
                    params.fields = _.assign({}, params.fields_old,params.data.fields)
                    params.fields.lastUpdated = Date.now()
                    params.change = params.data.fields
                    return await cudItem_callback(params,ctx)
                } else {
                    throw new ScirichonError("no record found")
                }
            }
        } else if (ctx.method === 'DELETE') {
            if(params.uuid){
                result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeWithRelationCypher(params), params, true)
                if(result&&result[0]&&result[0].self&&result[0].self.category){
                    params.category = result[0].self.category
                    params.name = result[0].self.name
                    params.fields_old = _.omit(result[0].self,'id')
                    if(result[0].items&&result[0].items.length){
                        if(checkReferenced(params.uuid,result[0].items)){
                            throw new ScirichonError("node already used")
                        }else{
                            return await cudItem_callback(params,ctx)
                        }
                    }else{
                        return await cudItem_callback(params,ctx)
                    }
                }else{
                    throw new ScirichonError("no record found")
                }
            }else if(ctx.deleteAll){
                params.cypher = cypherBuilder.generateDelAllCypher();
                return params
            }
        }
    },
    cudItem_postProcess:async function (result,params,ctx) {
        if(ctx.method==='POST'||ctx.method==='PUT'||ctx.method==='PATCH'){
            await scirichon_cache.set(params.uuid,{name:params.fields.name,uuid:params.uuid,category:params.category})
            if(params.name)
                await scirichon_cache.set(params.category+'_'+params.name,{name:params.fields.name,uuid:params.uuid,category:params.category})
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
        if(ctx.method==='DELETE'){
            if(params.uuid){
                if(result&&(result.length==1||result.deleted==1)){
                    await scirichon_cache.del(params.uuid)
                    if(params.name&&params.category){
                        await scirichon_cache.del(params.category+'_'+params.name)
                    }
                }else{
                    throw new ScirichonWarning('no record found')
                }
            }
            if(ctx.deleteAll)
                await scirichon_cache.flushAll()
        }
        if(needNofify(params,ctx)){
            try{
                await addNotification(params,ctx)
            }catch(err){
                throw new ScirichonWarning('add notification failed,' + String(err))
            }
        }
        return {uuid:params.uuid}
    },
    queryItems_preProcess:function (params,ctx) {
        params.category = getCategoryFromUrl(ctx)
        params = paginationParamsGenerator(params);
        params = queryParamsCypherGenerator(params);
        return params;
    },
    customizedQueryItems_preProcess:(params,ctx)=>{
        if(params.cypherQueryFile){
            params.cypher = fs.readFileSync('cypher/'+params.cypherQueryFile + '.cyp', 'utf8')
        }
        return params
    },
    queryItems_postProcess:async function (result,params,ctx) {
        result = _.isArray(result)&&result.length>0?result[0]:result
        if(result.count>0&&_.isArray(result.results)){
            result.results = await utils.resultMapper(result.results,params);
        }else{
            result = await utils.resultMapper(result,params);
        }
        return result
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
                    parents:schema.getParentSchemas(params.category),
                    references:_.uniq(_.map(schema.getSchemaRefProperties(params.category),(attr)=>attr.schema)),
                    subtypes:_.map(result,(subtype)=>subtype.category)
                })
            })
        })
    },
    getCategoryFromUrl:getCategoryFromUrl,
    getSchemaPropertiesProcess:function(params,ctx) {
        return schema.getSchemaProperties(params.category)
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


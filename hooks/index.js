const _ = require('lodash')
const uuid = require('uuid')
const schema = require('../schema')
const config = require('config')
const cypherBuilder = require('../cypher/cypherBuilder')
const LOGGER = require('log4js_wrapper')
const logger = LOGGER.getLogger()
const cmdb_cache = require('cmdb-cache')
const routesDef = cmdb_cache.cmdb_type_routes
const utils = require('../helper/utils')
const cypherInvoker = require('../helper/cypherInvoker')
const uuid_validator = require('uuid-validate')
const converter = require('../helper/converter')
const jp = require('jsonpath')
const common = require('scirichon-common')
const notifier_api_config = config.get('notifier')

const getCategoryFromUrl = function (url) {
    let category,key,val
    for (key in routesDef){
        val = routesDef[key]
        if(url.includes(val.route)){
            category = key
            break
        }
    }
    if(url.includes('/api/items'))
        category = schema.cmdbTypeName.All
    if(!category)
        throw new Error('can not find category from url:'+url)
    return category;
}

const logCypher = (params)=>{
    let cypher = params.cyphers||params.cypher
    let cypher_params = _.omit(params,['cypher','cyphers','data','fields','fields_old','method','url','token'])
    logger.debug(`cypher to executed:${JSON.stringify({cypher:cypher,params:cypher_params},null,'\t')}`)
}

const cudCypherGenerator = (params)=>{
    if(params.method === 'POST' || params.method === 'PUT' || params.method === 'PATCH'){
        if(schema.cmdbConfigurationItemTypes.includes(params.category)){
            params.cyphers = cypherBuilder.generateCmdbCyphers(params);
        }else if(params.category === schema.cmdbTypeName.ITService){
            params.cyphers = cypherBuilder.generateITServiceCyphers(params);
        }else if(schema.cmdbProcessFlowTypes.includes(params.category)){
            params.cyphers = cypherBuilder.generateProcessFlowCypher(params);
        }else if(params.category === schema.cmdbTypeName.Cabinet){
            params.cyphers = cypherBuilder.generateCabinetCyphers(params);
        }else if(params.category === schema.cmdbTypeName.Shelf){
            params.cyphers = cypherBuilder.generateShelfCyphers(params);
        }else{
            params.cypher = cypherBuilder.generateAddNodeCypher(params);
        }
    }
    else if(params.method === 'DELETE')
        params.cypher = cypherBuilder.generateDelNodeCypher(params)
    logCypher(params)
    return params;
}

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success',
    CONTENT_NODE_USED = 'node already used', DISPLAY_AS_TOAST='toast';

const paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('perPageSize')},skip;
    if(params.page){
        params.per_page = params.per_page || config.get('perPageSize')
        skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
        if(schema.isAuxiliaryTypes(params.category)){
            throw new Error(`${params.category} not support pagination`);
        }
        if(schema.isConfigurationItem(params.category)||schema.isProcessFlow(params.category)){
            params.pagination = true
        }
    }
    return _.assign(params,params_pagination);
}

const queryParamsCypherGenerator = function (params) {
    if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(params);
        if(utils.isChangeTimelineQuery(params.url))
            params.cypher = cypherBuilder.generateQueryNodeChangeTimelineCypher(params)
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(params);
    }
    /**
     * customized cypher query
     */
    if(params.category === schema.cmdbTypeName.ITService){
        if(params.uuids){
            params.uuids = params.uuids.split(",");
            params.cypher = cypherBuilder.generateQueryITServiceByUuidsCypher(params);
        }else if(params.search){
            params.search = params.search.split(",");
            params.cypher = cypherBuilder.generateAdvancedSearchITServiceCypher(params);
        }
    } else if(params.category === schema.cmdbTypeName.ConfigurationItem){
        if(params.mounted_rels){
            params.cypher = cypherBuilder.generateMountedConfigurationItemRelsCypher(params);
        }else if(params.cfgHostsByITServiceGroup){
            params.group_names = params.cfgHostsByITServiceGroup.split(",")
            params.cypher = cypherBuilder.generateCfgHostsByITServiceGroupCypher(params);
        }else if(params.cfgHostsByITService){
            params.service_names = params.cfgHostsByITService.split(",")
            params.cypher = cypherBuilder.generateCfgHostsByITServiceCypher(params);
        }
        else if(params.subcategory){
            params.subcategory = params.subcategory.split(",");
            params.cypher = cypherBuilder.generateQueryConfigurationItemBySubCategoryCypher(params);
        }
    }
    logCypher(params)
    return params;
}

const cudItem_params_stringify = (params, list) => {
    for(let name of list){
        if(_.isObject(params.fields[name])){
            params.fields[name] = JSON.stringify(params.fields[name])
        }
        if(params.change&&_.isObject(params.change[name])){
            params.change[name] = JSON.stringify(params.change[name])
        }
    }
    for (let key in params.fields){
        if(_.isArray(params.fields[key])){
            if(_.isObject(params.fields[key][0]))
                throw new Error('Property values can only be of primitive types or arrays thereof,invalid field:' + key)
            if(params.fields[key].length ==1&&params.fields[key][0]=='')
                params.fields[key] = []
        }
        else if(_.isObject(params.fields[key])){
            throw new Error('Property values can only be of primitive types or arrays thereof,invalid field:' + key)
        }
    }
    params = _.assign(params, params.fields)
    for(let name of list){
        if(_.isString(params[name])){
             try{
                 params[name] = JSON.parse(params[name])
             }catch(error){
                 //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
             }
        }
    }
}


const cudItem_params_name2IdConverter = (params)=>{
    var convert = (val)=>{
        let params_val = jp.query(params, `$.${val.attr}`)[0]
        let converted_val = converter[val.schema](params_val)
        jp.value(params, `$.${val.attr}`,converted_val)
        jp.value(params, `$.fields.${val.attr}`,converted_val)
    }
    let category = schema.getApiCategory(params.category)
    _.each(schema.nameConverterDef[category],(val)=>{
        val.schema = val.schema || category
        let params_val = jp.query(params, `$.${val.attr}`)[0]
        if(val.type === 'array' && _.isArray(params_val)){
            if(params_val[0]&&!uuid_validator(params_val[0])){
                convert(val)
            }
        }
        else if(_.isString(params_val)){
            if(!uuid_validator(params_val)){
                convert(val)
            }
        }
    })
    return params
}

const cudItem_callback = (params)=>{
    if(params.method === 'POST'||params.method === 'PUT' || params.method === 'PATCH'){
        params = _.assign(params, params.fields)
        cudItem_params_name2IdConverter(params)
        cudItem_params_stringify(params,utils.objectFields)
    }
    return cudCypherGenerator(params)
}


module.exports = {
    cudItem_preProcess: function (params, ctx) {
        params.method = ctx.method,params.user =_.pick(ctx.local,['alias','userid','avatar']),params.token = ctx.token,
            params.url = ctx.url,params.category = params.data?params.data.category:getCategoryFromUrl(params.url)
        if (params.method === 'POST') {
            let item_uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
            params.data.fields.uuid = item_uuid
            params.fields = _.assign({}, params.data.fields)
            params.fields.category = params.data.category
            params.fields.created = Date.now()
            if (params.data.category === schema.cmdbTypeName.IncidentFlow) {
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateSequence(schema.cmdbTypeName.IncidentFlow),params,(result,params)=>{
                    params.fields.pfid = 'IR' + result[0]
                    return cudItem_callback(params)
                })
            } else if(schema.cmdbConfigurationItemTypes.includes(params.category)){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateSequence(schema.cmdbTypeName.ConfigurationItem),params,(result,params)=>{
                    params.fields.barcode_id = String(result[0])
                    return cudItem_callback(params)
                })
            }
            else
                return cudItem_callback(params)
        }
        else if (params.method === 'PUT' || params.method === 'PATCH') {
            if(params.uuid){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQueryNodeCypher(params),params,(result,params)=>{
                    if (result && result[0]) {
                        params.fields_old = _.omit(result[0],'id')
                        params.fields = _.assign({}, params.fields_old,params.data.fields)
                        params.fields.lastUpdated = Date.now()
                        params.change = params.data.fields
                        return cudItem_callback(params, true)
                    } else {
                        throw new Error("no record found to patch,uuid or name:" + params.uuid||params.name);
                    }
                })
            }else{
                throw new Error('missing uuid when modify')
            }

        } else if (params.method === 'DELETE') {
            if(params.uuid){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQueryNodeWithRelationToConfigurationItem_cypher(params),params,(result, params)=>{
                    if(result&&result[0]&&result[0].self&&result[0].self.category){
                        params.category = result[0].self.category
                        params.fields_old = _.omit(result[0].self,'id')
                        if(result[0].items&&result[0].items.length&&schema.isAuxiliaryTypes(result[0].self.category)){
                            params.error = CONTENT_NODE_USED
                            params.cypher = cypherBuilder.generateDummyOperation_cypher(params)
                            return params
                        }else{
                            return cudItem_callback(params)
                        }
                    }else{
                        throw new Error("no record found to delete,uuid or name:" + params.uuid||params.name);
                    }
                })
            }else if(params.category === schema.cmdbTypeName.All){
                params.cypher = cypherBuilder.generateDelAllCypher();
                return params
            }else{
                throw new Error('missing uuid when delete')
            }
        }
    },
    cudItem_postProcess:function (result,params,ctx) {
        let response_wrapped = {
            "status":STATUS_INFO,
            "content": CONTENT_OPERATION_SUCESS,
            "displayAs":DISPLAY_AS_TOAST
        }
        if(params.method==='POST'||params.method==='PUT'||params.method==='PATCH'){
            if(!params.uuid||!params.fields)
                throw new Error('added obj without uuid')
            cmdb_cache.set(params.uuid,{name:params.fields.name,uuid:params.uuid,category:params.category})
            response_wrapped.uuid = params.uuid
        }
        if(params.method==='DELETE'){
            if(params.uuid){
                response_wrapped.uuid = params.uuid
                if(result.length==1){
                    if(!params.error){
                        cmdb_cache.del(params.uuid)
                    }
                }else{
                    params.error = CONTENT_NO_RECORD
                }
            }
            if(params.category===schema.cmdbTypeName.All)
                cmdb_cache.flushAll()
        }
        if(params.error){
            response_wrapped.status = STATUS_WARNING
            response_wrapped.content = params.error
        }else{
            let notification_obj = {type:params.category,user:params.user,token:params.token,source:'cmdb'}
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
            common.apiInvoker('POST',notifier_api_config.base_url,'','',notification_obj)
        }
        return　response_wrapped;
    },
    queryItems_preProcess:function (params,ctx) {
        params.method = ctx.method,params.url = ctx.url,params.category = getCategoryFromUrl(ctx.url)
        params = paginationParamsGenerator(params);
        params = queryParamsCypherGenerator(params);
        return params;
    },
    queryItems_postProcess:function (result,params,ctx) {
        let response_wrapped = {
            "status":STATUS_OK, //ok, info, warning, error,
            "message":{
                "content":CONTENT_QUERY_SUCESS,
                "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
            },
            "data":{}
        };
        result = _.isArray(result)&&result.length>0?result[0]:result;
        if(!result||result.total==0||result.count==0||result.length==0){
            response_wrapped.message.content = CONTENT_NO_RECORD;
            return response_wrapped;
        }
        if(params.search&&result.count>0&&_.isArray(result.results)){
            result.results = utils.resultMapper(result.results,params);
        }else{
            result = utils.resultMapper(result,params);
        }
        response_wrapped.data = result;
        return response_wrapped;
    },
    configurationItemCategoryProcess:function(params) {
        let response_wrapped = {
            "status":STATUS_OK, //ok, info, warning, error,
            "message":{
                "content":CONTENT_QUERY_SUCESS,
                "displayAs":DISPLAY_AS_TOAST//toast, modal, console, alert
            },
            "data":{}
        };
        response_wrapped.data = schema.cmdbConfigurationItemInheritanceRelationship;
        if(params.filter == schema.cmdbTypeName.Asset){
            response_wrapped.data = schema.cmdbConfigurationItemInheritanceRelationship.children[1];
        }
        return response_wrapped;
    },
    getCategoryFromUrl:getCategoryFromUrl
}


var _ = require('lodash')
var uuid = require('uuid')
var schema = require('../schema')
var config = require('config')
var cypherBuilder = require('../cypher/cypherBuilder')
var cypherResponseMapping = require('../cypher/cypherResponseMapping')
var cache = require('../cache')
var logger = require('../logger')
var routesDef = require('../routes/def')
var utils = require('../helper/utils')
var path = require('path')
var JsBarcode = require('jsbarcode')
var Canvas = require('canvas')
var cypherInvoker = require('../helper/cypherInvoker')
var uuid_validator = require('uuid-validate')
var converter = require('../helper/converter')
var jp = require('jsonpath');

var getCategoryFromUrl = function (url) {
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

var logCypher = (params)=>{
    let cypher = params.cyphers||params.cypher
    let cypher_params = _.omit(params,['cypher','cyphers','data','fields','fields_old','method','url','token'])
    logger.debug(`cypher to executed:${JSON.stringify({cypher:cypher,params:cypher_params},null,'\t')}`)
}

var createOrUpdateCypherGenerator = (params)=>{
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
    if(params.method == 'PUT'||params.method =='PATCH')
        params.cyphers = [...params.cyphers,cypherBuilder.generateAddPrevNodeRelCypher(params)];
    logCypher(params)
    return params;
}

var deleteCypherGenerator = (params)=>{
    params.cypher = cypherBuilder.generateDelNodeCypher(params);
    logCypher(params)
    return params;
}

const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_INFO = 'info',
    CONTENT_QUERY_SUCESS='query success',CONTENT_NO_RECORD='no record found',CONTENT_OPERATION_SUCESS='operation success',
    CONTENT_NODE_USED = 'node already used', DISPLAY_AS_TOAST='toast';

var paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('config.perPageSize')},skip;
    if(params.page){
        params.per_page = params.per_page || config.get('config.perPageSize')
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

var queryParamsCypherGenerator = function (params) {
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
        if(params.url.includes(utils.cutomized_route.cfgItems_cabinets_mounted)){
            params.cypher = cypherBuilder.generateMountedConfigurationItemCypher(params);
        }else if(params.url.includes(utils.cutomized_route.itservice_group_host)){
            if(!params.group_names)
                throw new Error('missing param group_names')
            params.group_names = params.group_names.split(",")
            params.cypher = cypherBuilder.generateITServiceGroupHostsCypher(params);
        }
    }
    logCypher(params)
    return params;
}

var cudItem_params_stringify = (params, list) => {
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


var cudItem_params_name2IdConverter = (params)=>{
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

var cudItem_callback = (params,update)=>{
    params.fields = _.assign(params.fields, params.data.fields)
    if(update){
        params.fields.lastUpdated = Date.now()
    }else{
        params.fields.category = params.data.category
        params.fields.created = Date.now()
    }
    params = _.assign(params, params.fields)
    cudItem_params_name2IdConverter(params)
    cudItem_params_stringify(params,utils.objectFields)
    return createOrUpdateCypherGenerator(params)
}

var updateItem = (result,params)=>{
    if (result && result[0]) {
        let old_val = _.omit(result[0],'id')
        params.fields_old = old_val
        params.fields = _.assign({}, old_val);
        params.change = params.data.fields
        return cudItem_callback(params, true)
    } else {
        throw new Error("no record found to patch,uuid or name:" + params.uuid||params.name);
    }
}

var initialize = (app)=>{
    app.neo4jConnection.initialized.then(()=>{
            cache.loadAll();
        }).catch((error)=>{
            logger.fatal('neo4j is not reachable,' + String(error))
            process.exit(-1)
        })
}

module.exports = {
    cudItem_preProcess: function (params, ctx) {
        params.method = ctx.method,params.url = ctx.url,params.category = params.data?params.data.category:getCategoryFromUrl(params.url)
        if (params.method === 'POST') {
            let item_uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
            params.data.fields.uuid = item_uuid
            if (params.data.category === schema.cmdbTypeName.IncidentFlow) {
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateSequence(schema.cmdbTypeName.IncidentFlow),params,(result,params)=>{
                    params.data.fields.pfid = 'IR' + result[0]
                    return cudItem_callback(params)
                })
            } else if(schema.cmdbConfigurationItemTypes.includes(params.category)){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateSequence(schema.cmdbTypeName.ConfigurationItem),params,(result,params)=>{
                    let barcode_id = result[0]
                    let canvas = new Canvas();
                    JsBarcode(canvas, barcode_id);
                    params.data.fields.barcode = {id:barcode_id,url:canvas.toDataURL()}
                    return cudItem_callback(params)
                })
            }
            else
                return cudItem_callback(params)
        }
        else if (params.method === 'PUT' || params.method === 'PATCH') {
            if(params.uuid){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQueryNodeCypher(params),params,(result,params)=>{
                    return updateItem(result,params)
                })
            }else{
                throw new Error('missing uuid when modify')
            }

        } else if (params.method === 'DELETE') {
            if(params.uuid){
                return cypherInvoker.fromCtxApp(ctx.app,cypherBuilder.generateQueryNodeRelations_cypher(params),params,(result,params)=>{
                    if(result&&result[0]&&result[0].rels&&result[0].rels.length&&result[0].self&&result[0].self.category&&schema.isAuxiliaryTypes(result[0].self.category)){
                        params.used = true
                        params.cypher = cypherBuilder.generateDummyOperation_cypher(params)
                        return params
                    }else{
                        return deleteCypherGenerator(params)
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
            cache.set(params.uuid,{name:params.fields.name,uuid:params.uuid,category:params.category})
            response_wrapped.uuid = params.uuid
        }
        if(params.method==='DELETE'){
            if(params.uuid){
                response_wrapped.uuid = params.uuid
                if(result.length==1){
                    if(params.used){
                        response_wrapped.status = STATUS_WARNING
                        response_wrapped.content = CONTENT_NODE_USED
                    }else{
                        cache.del(params.uuid)
                    }
                }else{
                    response_wrapped.status = STATUS_WARNING
                    response_wrapped.content = CONTENT_NO_RECORD
                }
            }
            if(params.category===schema.cmdbTypeName.All)
                cache.flushAll()
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
            response_wrapped.status = STATUS_WARNING;
            return response_wrapped;
        }
        result = cypherResponseMapping.resultMapper(result,params);
        result = cypherResponseMapping.removeInternalPropertys(result);
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
    getCategoryFromUrl:getCategoryFromUrl,
    initialize
}


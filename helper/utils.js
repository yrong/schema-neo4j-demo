const _ = require('lodash');
const cmdb_cache = require('cmdb-cache')
const schema = require('../schema')

const globalHiddenFields = ['fields', 'cyphers', 'method', 'data', 'token', 'fields_old', 'change', 'url', 'id', '_id', '_index', '_type','user']
    , globalHiddenFieldsInAllLevel = ['passwd', 'id']
    , objectFields = ['asset_location', 'geo_location', 'status', 'barcode']
    , referencedFields = ['responsibility', 'committer', 'executor']
    , referencedArrayFields = ['it_service']

const removeInternalProperties = (val) => {
    for (let prop in val) {
        for(let hidden_prop of globalHiddenFields){
            if (prop === hidden_prop)
                delete val[prop];
        }
    }
    return recursivelyRemoveInternalProperties(val)
}

const recursivelyRemoveInternalProperties =  (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return recursivelyRemoveInternalProperties(val);
        });
    } else {
        for (let prop in val) {
            for(let hidden_prop of globalHiddenFieldsInAllLevel){
                if (prop === hidden_prop)
                    delete val[prop];
            }
            if (typeof val[prop] === 'object')
                if(prop !== 'status')//not remove 'fields' in field 'status'
                    recursivelyRemoveInternalProperties(val[prop]);
        }
    }
    return val;
}

const referencedMapper_assetLocation = (val)=>{
    let asset_val = {}
    if(val['cabinet']){
        asset_val = val['cabinet']=cmdb_cache.get(val['cabinet'])||val['cabinet']
    }
    if(val['shelf']){
        asset_val = val['shelf']=cmdb_cache.get(val['shelf'])||val['shelf']
    }
    if(asset_val['parent'])
        asset_val['parent']=cmdb_cache.get(asset_val['parent'])||val['parent']
}

const referencedMapper = (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return referencedMapper(val);
        });
    } else {
        for (let key in val) {
            let val_val = val[key]
            for(let field of objectFields){
                if(key === field){
                    if(_.isString(val_val)){
                        try{
                            val[key] = JSON.parse(val_val)
                        }catch(error){
                        }
                    }
                    if(key === 'asset_location'&&val[key]){
                        referencedMapper_assetLocation(val[key])
                    }
                }
            }
            for(let field of referencedFields) {
                if (key === field) {
                    val[key] = cmdb_cache.get(val_val)
                }
            }
            for(let field of referencedArrayFields) {
                if (key === field) {
                    val[key] = _.map(val_val,(id)=>{
                        return cmdb_cache.get(id)
                    })
                }
            }
        }
    }
    return val;
}

var timelineMapper = (result)=>{
    let change_logs = [], change_log, index = 0, segments = result[0].segments
    for (let segment of segments) {
        change_log = {}
        change_log.user = segment.start.committer
        change_log.time = segment.start.lastUpdated
        change_log.object = {
            start: segment.start,
            end: segment.end,
            change_fields: _.omit(segment.relationship,'id')
        }
        change_logs.push(change_log)
        index++
    }
    return change_logs
}

var propertiesCombine = (results)=>{
    return _.map(results,(result)=>{
        if(result.self&&result.members){
            result = _.merge(result.self,{members:result.members})
            return result
        }
        return result
    })
}

const isChangeTimelineQuery = (url) => {
    var re = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/timeline/i;
    return re.test(url)
}

const resultMapper = (result, params) => {
    if (params.url && isChangeTimelineQuery(params.url)) {
        result = timelineMapper(result)
    }
    if (params.category === schema.cmdbTypeName.ConfigurationItem || params.category === schema.cmdbTypeName.ProcessFlow)
        result = referencedMapper(result)
    if (params.category === schema.cmdbTypeName.ITServiceGroup || params.category === schema.cmdbTypeName.WareHouse || params.category === schema.cmdbTypeName.ServerRoom)
        result = propertiesCombine(result)
    result = removeInternalProperties(result)
    return result
}

module.exports = {
    isChangeTimelineQuery,
    resultMapper,
    objectFields,
    globalHiddenFields
}
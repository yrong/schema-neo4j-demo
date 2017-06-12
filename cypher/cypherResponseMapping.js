var _ = require('lodash');
var cache = require('../cache')
var utils = require('../helper/utils')
var schema = require('../schema')

const removeInternalProperties = (val) => {
    for (let prop in val) {
        for(let hidden_prop of utils.globalHiddenFields){
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
            for(let hidden_prop of utils.globalHiddenFieldsInAllLevel){
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

const referencedMapper = (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return referencedMapper(val);
        });
    } else {
        for (let key in val) {
            let val_val = val[key]
            for(let field of utils.objectFields){
                if(key === field){
                    if(_.isString(val_val)){
                        try{
                            val[key] = JSON.parse(val_val)
                        }catch(error){
                        }
                    }
                }
            }
            for(let field of utils.referencedFields) {
                if (key === field) {
                    val[key] = cache.get(val_val)
                }
            }
            for(let field of utils.referencedArrayFields) {
                if (key === field) {
                    val[key] = _.map(val_val,(id)=>{
                        return cache.get(id)
                    })
                }
            }
            if (typeof val_val === 'object'){
                val[key] = referencedMapper(val_val);
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

module.exports = {
    removeInternalPropertys: removeInternalProperties,
    resultMapper: (result, params) => {
        if (params.url&&utils.isChangeTimelineQuery(params.url)) {
            result = timelineMapper(result)
        }
        if(params.category === schema.cmdbTypeName.ConfigurationItem || params.category === schema.cmdbTypeName.ProcessFlow)
            return referencedMapper(result)
        if(params.category === schema.cmdbTypeName.ITServiceGroup || params.category === schema.cmdbTypeName.WareHouse || params.category === schema.cmdbTypeName.ServerRoom)
            return propertiesCombine(result)
        return result
    }
}


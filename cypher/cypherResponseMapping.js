var _ = require('lodash');
var cache = require('../cache')
var utils = require('../helper/utils')
var schema = require('../schema')

const removeInternalPropertys = (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return removeInternalPropertys(val);
        });
    } else {
        for (let prop in val) {
            for(let hidden_prop of utils.globalHiddenFields){
                if (prop === hidden_prop)
                    delete val[prop];
            }
            if (typeof val[prop] === 'object')
                removeInternalPropertys(val[prop]);
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

module.exports = {
    removeInternalPropertys: removeInternalPropertys,
    resultMapper: (result, params) => {
        if (params.url&&utils.isChangeTimelineQuery(params.url)) {
            result = timelineMapper(result)
        }
        if(params.category === schema.cmdbTypeName.ConfigurationItem || params.category === schema.cmdbTypeName.ProcessFlow)
            return referencedMapper(result)
        return result
    }
}


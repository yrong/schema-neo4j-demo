var _ = require('lodash');
var schema = require('./../schema/index')
var cache = require('../cache')

const hidden_properties = ['id','_id','_index','_type','passwd','change']
const removeInternalPropertys = (val) => {
    if (_.isArray(val)) {
        val = _.map(val, function (val) {
            return removeInternalPropertys(val);
        });
    } else {
        for (let prop in val) {
            for(let hidden_prop of hidden_properties){
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
        for (let val_key in val) {
            let val_val = val[val_key]
            if(val_key == 'asset_location'){
                val_val = JSON.parse(val_val)
                val.asset_location = val_val
            }
            if(val_val){
                if(val_key == 'userid'){
                    val.user = cache.get(val_val)
                }
                if(val_key == 'committer'){
                    val.committer = cache.get(val_val)
                }
                if(val_key=='executor'){
                    val.executor = cache.get(val_val)
                }
                if(val_key == 'cabinet'){
                    val.cabinet = cache.get(val_val)
                }
                if(val_key == 'position'){
                    val.position = cache.get(val_val)
                }
                if(val_key == 'it_service'){
                    val.it_service=_.map(val[val_key],(val_val)=>{
                        return cache.get(val_val)
                    })
                }
                if (typeof val_val === 'object'){
                    referencedMapper(val_val);
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
        change_log.action = (index == segments.length - 1 ? 'created' : 'updated')
        change_log.object = {
            start: _.omit(segment.start, ['change']),
            end: _.omit(segment.end, ['change']),
            change_fields: segment.start.change?JSON.parse(segment.start.change):null
        }
        change_logs.push(change_log)
        index++
    }
    return change_logs
}

module.exports = {
    removeInternalPropertys: removeInternalPropertys,
    resultMapper: (result, params) => {
        if (params.url&&params.url.includes('/timeline')) {
            result = timelineMapper(result)
        }
        return params.getReferencedObj?referencedMapper(result):result
    }
}


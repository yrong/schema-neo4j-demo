var moment = require('moment');
module.exports = {
    toBoolean:(val)=>{
        if(val&&(val.v === 'Yes' || val.v === 'yes' || val.v === '1'))
            return true
        else if(val&&(val.v === 'No' || val.v === 'no' || val.v === '0'))
            return false
        else
            return null
    },
    toInteger:(val)=>{return val?parseInt(val.v):null},
    toDate:(val)=>{return val?moment(val.w,'YYYY-M-D').format('YYYY-MM-DD'):null},
    toArray:(val)=>{return val?val.v.split(','):null},
    toString:(val)=>{return val?val.v:null}
}
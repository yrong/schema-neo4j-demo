var _ = require('lodash')
var apiInvoker = require('./apiInvoker')

module.exports={
    cabinet_u_unique:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            let response = await apiInvoker.apiGetter('/relationship/located/mounted'),matched
            if(response&&response.data){
                matched = _.find(response.data,(mounted_cabinet)=>{
                    return mounted_cabinet.cabinet === asset.asset_location_cabinet && mounted_cabinet.u === asset.asset_location_u
                })
            }
            if(matched)
                throw new Error('Cabinet_U unique constraint violation')
        }
    }
}

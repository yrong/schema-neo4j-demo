const _ = require('lodash')
const apiInvoker = require('./apiInvoker')
const utils = require('./utils')

module.exports={
    cabinet_u_unique:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            let response = await apiInvoker.apiGetter('/cfgItems',{mounted_rels:true}),matched
            if(response&&response.data){
                matched = _.find(response.data,(mounted_cabinet)=>{
                    return (mounted_cabinet.cabinet.name === asset.asset_location_cabinet || mounted_cabinet.cabinet.uuid === asset.asset_location_cabinet)
                        && mounted_cabinet.u === asset.asset_location_u
                })
            }
            if(matched)
                throw new Error('Cabinet_U unique constraint violation')
        }
    }
}

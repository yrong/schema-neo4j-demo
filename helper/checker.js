const _ = require('lodash')
const common = require('scirichon-common')
const config = require('config')
const base_url=`http://localhost:${config.get('port')}/api`

module.exports={
    cabinet_u_unique:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            let response = await common.apiInvoker('POST',base_url,'/searchByCypher','',{"category":"ConfigurationItem", "cypherQueryFile":"mountedConfigurationItemRels"}),matched
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

var _ = require('lodash')
var checker = require('./../helper/checker')

module.exports = {
    buildAssetLocation:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            asset.asset_location = {cabinet:asset.asset_location_cabinet,status:"mounted",u:asset.asset_location_u,date_mounted:asset.asset_location_mounted_date}
            await checker.cabinet_u_unique(asset)
        }
        else if(asset&&asset.asset_location_position)
            asset.asset_location = {position:asset.asset_location_position,status:"unmounted"}
        return asset
    },
    omitProperties:async(configuratonItem)=>{
        return _.omit(configuratonItem,['directory_type','created_date','last_updated_date','asset_location_cabinet','asset_location_u','asset_location_mounted_date','asset_location_position'])
    }
}
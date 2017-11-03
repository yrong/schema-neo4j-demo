var _ = require('lodash')
var apiInvoker = require('../../helper/apiInvoker')

module.exports = {
    buildAssetLocation:async (asset) =>{
        if(asset&&asset.asset_location_cabinet){
            asset.asset_location = {cabinet:asset.asset_location_cabinet,status:"mounted",u:asset.asset_location_u,date_mounted:asset.asset_location_mounted_date}
            await apiInvoker.check_cabinet_u_unique(asset)
        }
        else if(asset&&asset.asset_location_shelf)
            asset.asset_location = {shelf:asset.asset_location_shelf,status:"unmounted"}
        if(_.isString(asset.geo_location))
            asset.geo_location = {name:asset.geo_location}
        return asset
    },
    omitProperties:async(configuratonItem)=>{
        return _.omit(configuratonItem,['directory_type','created_date','last_updated_date','asset_location_cabinet','asset_location_u','asset_location_mounted_date','asset_location_position'])
    }
}
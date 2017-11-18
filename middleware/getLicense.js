const license_helper = require('license-helper')
const moment = require('moment')

module.exports = async (ctx, next) => {
    let license = license_helper.getLicense()
    let expiration_date = moment(license.expiration),now = license_helper.now()
    if(expiration_date.isBefore(now)){
        console.log('license expired,please contact administrator')
        process.exit(-1)
    }
    ctx.state.license = license
    await next();
}
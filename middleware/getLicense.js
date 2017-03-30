const license_checker = require('cmdb-license-checker')
const moment = require('moment')

module.exports = async (ctx, next) => {
    let license = license_checker.getLicense()
    let expiration_date = moment(license.expiration),now = license_checker.now()
    if(expiration_date.isBefore(now)){
        console.log('license expired,please contact administrator')
        process.exit(-1)
    }
    ctx.state.license = license
    await next();
}
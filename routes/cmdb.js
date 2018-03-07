const search = require('../search')

module.exports = (app)=> {

    /*deprecated*/
    app.defineAPI({
        method: 'POST',
        route: '/api/search/cfgItems',
        procedure: search.searchItem
    })

}
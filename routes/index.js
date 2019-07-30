const search = require('scirichon-search')
const route = require('scirichon-crud-handler').route

module.exports = {
    load: (app)=>{
        route(app)
        app.defineAPI({
            method: 'POST',
            route: '/api/search/cfgItems',
            procedure: search.searchItem
        })
    }
}

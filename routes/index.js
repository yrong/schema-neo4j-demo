const search = require('scirichon-search')
const routes = require('scirichon-crud-handler').routes


module.exports = {
    commonRoute: (app)=>{
        routes(app)
    },
    customizedRoute:(app)=>{
        app.defineAPI({
            method: 'POST',
            route: '/api/search/cfgItems',
            procedure: search.searchItem
        })
    }
}
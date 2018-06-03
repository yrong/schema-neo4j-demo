const middlewares = require('scirichon-crud-handler').middlewares

module.exports = {
    load:(app)=>{
        middlewares(app)
    }
}
const middleware = require('scirichon-crud-handler').middleware

module.exports = {
    load:(app)=>{
        middleware(app)
    }
}

var r=require("request");
var config = require('config')
var host=config.get('config.neo4j.host')
var port=config.get('config.neo4j.http_port')
var neo4jUrl = `http://${host}:${port}/db/data/transaction/commit`;

module.exports = (query, params) => {
    return new Promise((resolve, reject) => {
        r.post({
                uri: neo4jUrl,
                json: {statements: [{statement: query, parameters: params}]}
            },
            function (err, res) {
                if(err)
                    reject(err)
                else
                    resolve(res.body)
            })
            .auth(config.get('config.neo4j.user'), config.get('config.neo4j.password'))
    })
}
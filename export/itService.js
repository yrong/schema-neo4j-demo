var r=require("request");
var config = require('config')
var jsonfile = require('jsonfile')
var fs = require('file-system')
var path = require('path')
var moment = require('moment');
var host=config.get('config.neo4j.host')
var port=config.get('config.neo4j.http_port')
var neo4jUrl = `http://${host}:${port}/db/data/transaction/commit`;

function cypher(query, params, cb) {
    r.post({
            uri: neo4jUrl,
            json: {statements: [{statement: query, parameters: params}]}
        },
        function (err, res) {
            cb(err, res.body)
        })
        .auth(config.get('config.neo4j.user'), config.get('config.neo4j.password'))
}

var query = `MATCH (n) WHERE n:ITService OR n:ITServiceGroup RETURN collect(n)`
cypher(query,{},function(err, result) {
    if(err){
        console.log(err)
    }else{
        let items = result.results[0].data[0].row[0],directory,timestamp
        if(items&&items.length){
            timestamp = moment().format('YYYYMMDDHHmmss')
            directory = './data/'+timestamp
            fs.mkdirSync(directory)
            var file = directory + '/services.json'
            jsonfile.writeFile(file, items, function (err) {
                if(err)
                    console.error(err)
                console.log(`dumping services to ${directory} successfully! you can import later with '/bin/bash ./script/import.sh --service_only --dir=${timestamp}'`)
                process.exit()
            })

        }

    }

});
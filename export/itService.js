var config = require('config')
var jsonfile = require('jsonfile')
var fs = require('file-system')
var path = require('path')
var moment = require('moment');
var cypherInvoker = require('../helper/cypherInvoker')

var query = `MATCH (n) WHERE n:ITService OR n:ITServiceGroup RETURN collect(n)`
cypherInvoker(query, {}).then((result) => {
    let items = result.results[0].data[0].row[0], directory, timestamp
    if (items && items.length) {
        timestamp = moment().format('YYYYMMDDHHmmss')
        directory = path.join(config.get('config.export.storeDir'), timestamp)
        fs.mkdirSync(directory)
        var file = path.join(directory, 'services.json')
        jsonfile.writeFile(file, items, function (err) {
            if (err)
                console.error(err)
            console.log(`dumping services to ${directory} successfully! you can import later with '/bin/bash ./script/import.sh --service_only --dir=${timestamp}'`)
            process.exit()
        })
    }
}).catch(console.log)

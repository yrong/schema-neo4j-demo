var mysqlDriver = require('mysql');
var neo4jDriver = require('neo4j-driver').v1;

var config = require('config');
var mysqlConfig = config.get('config.mysql');
var neo4jConfig = config.get('config.neo4j');

var syncPromise = function() {
    return new Promise(function (resolve, reject) {
        var mysql = mysqlDriver.createConnection({
            host: mysqlConfig.host,
            port: mysqlConfig.port,
            user: mysqlConfig.user,
            password: mysqlConfig.password,
            database:　mysqlConfig.database
        });
        mysql.connect();


        var neo4j = neo4jDriver.driver("bolt://"+neo4jConfig.host, neo4jDriver.auth.basic(neo4jConfig.user, neo4jConfig.password));

        var session = neo4j.session();

        console.time("migrationConsuming")
        mysql.query("SELECT * FROM users", function (err, rows, fields) {
            if (err) throw err;
            var promises = [];
            console.log("user count:" + rows.length)
            rows.forEach(function (row) {
                var cypher = "MERGE (u:User{userid:" + row.userid + "}) ON CREATE SET u = {row},u.uuid={row}.userid ON MATCH SET u = {row},u.uuid={row}.userid";
                promises.push(session.run(cypher,{'row':row}));
            });
            Promise.all(promises).then(function(){
                session.close();
                console.timeEnd("migrationConsuming");
                resolve(rows);
                if (require.main === module) {
                    process.exit();
                }

            }).catch(function(error){
                console.log(error);
                reject(error);
            })
        })
        mysql.end();
    });
}

if (require.main === module) {
    syncPromise();
}

module.exports = syncPromise;


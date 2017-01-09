#! /bin/bash

curl -XDELETE 'http://localhost:9200/cmdb/'

curl -XPUT 'http://localhost:9200/cmdb/' -d'{
        "mappings" : {
            "processFlow":{
                "properties": {
                    "uuid": {
                        "type": "string",
                        "index": "not_analyzed"
                    }
                }
            }
        }
}'

$NEO4J_HOME/bin/neo4j-shell -file ./cypher/cmdbSchema.cyp



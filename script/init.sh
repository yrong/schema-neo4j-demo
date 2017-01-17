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

$NEO4J_HOME/bin/neo4j-shell -file ./cypher/initSchema.cyp

#curl -H accept:application/json -H content-type:application/json \
#  --user neo4j:neo4j -d '{"statements":[{"statement":"MATCH (n) WHERE n:ITService OR n:ITServiceGroup RETURN n"}]}' \
#  http://localhost:7474/db/data/transaction/commit



#! /bin/bash

echo $'delete index'
curl -XDELETE 'http://localhost:9200/cmdb/'

echo $'\n\ncreate index and add schema in es'
curl --header "Content-Type: application/json" -XPUT 'http://localhost:9200/cmdb/' -d @./search/schema.json

echo $'\n\nadd constraint in neo4j'
/bin/bash ./script/execute_cypher.sh ./cypher/initSchema.cyp




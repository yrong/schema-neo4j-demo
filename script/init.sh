#! /bin/bash

curl -XDELETE 'http://localhost:9200/cmdb/'

curl --header "Content-Type: application/json" -XPUT 'http://localhost:9200/cmdb/' -d @./search/schema.json

/bin/bash ./script/execute_cypher.sh ./cypher/initSchema.cyp




#! /bin/bash

curl -XDELETE 'http://localhost:9200/cmdb/'

curl --header "Content-Type: application/json" -XPUT 'http://localhost:9200/cmdb/' -d @./search/schema.json

$NEO4J_HOME/bin/neo4j-shell -file ./cypher/initSchema.cyp




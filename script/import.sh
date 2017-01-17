#! /bin/bash

#$NEO4J_HOME/bin/neo4j-shell -file ./cypher/dropSchema.cyp

curl -X DELETE --header "Content-Type: application/json" --url "http://localhost:3001/api/items"

cat ./data/$1/neo4j.dump | $NEO4J_HOME/bin/neo4j-shell

elasticdump \
  --input=./data/$1/es.dump \
  --output=http://localhost:9200/cmdb \
  --type=data




#! /bin/bash

timestamp=$(date +"%Y%m%d%H%M%S")
mkdir -p ./data/$timestamp

$NEO4J_HOME/bin/neo4j-shell -c dump > ./data/$timestamp/neo4j.dump

elasticdump \
  --input=http://localhost:9200/cmdb \
  --output=./data/$timestamp/es.dump \
  --type=data

if [ $? -eq 0 ]; then
    echo "dumping data to $timestamp successfully! you can import later with '/bin/bash ./script/import.sh $timestamp'"
fi

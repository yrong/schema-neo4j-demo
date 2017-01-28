#! /bin/bash

usage() { echo "Usage: $0 [--service_only]" 1>&2; exit 1; }

service_only=0

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        -h | --help)
            usage
            exit
            ;;
        --service_only)
            service_only=1
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

if [ $service_only -eq 0 ]; then
    timestamp=$(date +"%Y%m%d%H%M%S")
    mkdir -p ./data/$timestamp
    $NEO4J_HOME/bin/neo4j-shell -c dump > ./data/$timestamp/neo4j.dump
    elasticdump \
      --input=http://localhost:9200/cmdb \
      --output=./data/$timestamp/es.dump \
      --type=data
    if [ $? -eq 0 ]; then
        echo "dumping data to $timestamp successfully! you can import later with '/bin/bash ./script/import.sh --dir=$timestamp'"
    fi
else
   echo "export service only"
   node ./export/itService.js
fi





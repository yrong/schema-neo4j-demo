#! /bin/bash

usage() { echo "Usage: $0" 1>&2; exit 1; }

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        -h | --help)
            usage
            exit
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

storeDir=$(cat ./config/default.json|./script/jq-linux64 '.config.export.storeDir'| sed -e 's/^"//' -e 's/"$//')
timestamp=$(date +"%Y%m%d%H%M%S")
mkdir -p $storeDir/$timestamp
$NEO4J_HOME/bin/neo4j-shell -c dump > $storeDir/$timestamp/neo4j.dump
if [ $? -eq 0 ]; then
    echo "dumping data to $timestamp successfully! you can import later with '/bin/bash ./script/import.sh --dir=$storeDir/$timestamp'"
fi





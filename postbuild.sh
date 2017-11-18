#! /bin/bash

git_commit_id=$(git rev-parse HEAD)
git_commit_date=$(git show -s --format=%ci HEAD |tail |awk '{print $1}')
filename="$git_commit_date-$git_commit_id"

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        --dir)
            releaseDir=$VALUE
            ;;
        --edition)
            edition=$VALUE
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

if [ "$edition" = "docker" ]; then
    docker rm -f cmdb
    docker rmi cmdb:$git_commit_id
    docker build -t cmdb:$git_commit_id .
elif [ "$edition" = "essential" ]; then
    tar -zcvf $releaseDir/cmdb-$git_commit_date-$git_commit_id.tar.gz ./build
else
  echo "$edition not recognized"
  exit 1
fi

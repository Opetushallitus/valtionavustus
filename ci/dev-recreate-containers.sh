#!/bin/bash
# Recreate containers

NETWORK="valtionavustus"

function remove-container {
  CONTAINER=$(docker ps -a | awk '{ print $1,$2 }' | grep $1 | awk '{ print $1 }')
  docker stop $CONTAINER
  docker rm $CONTAINER
}

function create-container {
  cd $1
  docker build -t $1 .
  cd ..
}

function run-container {
  cd $1
  docker run -d -p "$2:$2" --env-file="$1.env" --name "$1" --net "$NETWORK" --network-alias "$1" "$1"
  cd ..
}

cd ..

# va-virkailija
remove-container "va-virkailija"
create-container "va-virkailija"
run-container "va-virkailija" 8081


# va-hakija
remove-container "va-hakija"
create-container "va-hakija"
run-container "va-hakija" 8080

# va-proxy
remove-container "va-proxy"
create-container "va-proxy"
cd va-proxy
docker run -d -p 80:80 --net "$NETWORK" --name va-proxy --network-alias va-proxy va-proxy
cd ..

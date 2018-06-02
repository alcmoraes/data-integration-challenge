#!/bin/bash

# Removing existent containers
if docker ps | grep "yawoen_mongo" ;
then
  echo "Removing existent mongo container..."
  docker stop yawoen_mongo &> /dev/null
  docker rm -f yawoen_mongo &> /dev/null
  echo "Done!"
fi
if docker ps | grep "yawoen_api" ;
then
  echo "Removing existent api container..."
  docker stop yawoen_api &> /dev/null
  docker rm -f yawoen_api &> /dev/null
  echo "Done!"
fi
# Building compose
echo "Building project and turning compose on. This may take a while..."
docker-compose up -d --build
echo "Done!"

echo "Installing dependencies and migrating initial data"
docker exec yawoen_api bash -c "yarn"
docker exec yawoen_api bash -c "node tasks/bootstrap.js"
echo "Done!"

echo "Turning compose down..."
docker-compose stop
echo "Setup done!"
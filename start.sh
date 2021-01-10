#!/bin/sh

docker kill chardin-deploy

docker container rm chardin-deploy

docker rmi -f chardin-dev

docker build -t chardin-dev .

docker run --name chardin-deploy -d -p 80:8080 chardin-dev

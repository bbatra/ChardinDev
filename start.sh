#!/bin/sh

docker kill chardin-dev

docker container rm chardin-dev

docker rmi -f chardin-dev

docker build -t chardin-dev .

docker run -d -p 80:8080 chardin-dev

#!/bin/sh

docker build -t your-app-name .

docker run -d -p 80:8080 your-app-name

#!/bin/sh

npm install
npm run build

docker build -t psalchow/corn-watch-sink .
#!/bin/sh

npm install
npm run build

docker build -t psalchow/grain-watch-sink .
#!/bin/bash

docker build --build-arg CACHEBUST=$(date +%d) -t puppeteer-chrome-linux .

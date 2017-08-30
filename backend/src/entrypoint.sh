#!/bin/bash

executablePath=`node chromium_executable_path.js`

#$executablePath --disable-setuid-sandbox --no-sandbox --headless $1
$executablePath $1

#!/bin/bash

executablePath=`node chromium_executable_path.js`

#$executablePath --headless $1
$executablePath $1

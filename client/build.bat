#!/usr/bin/env bash

IF EXIST "../server/client-build" (
    rmdir /S /Q "../server/client-build"
)
mkdir "../server/client-build"
move build/static ../server/client-build
move build\\* ../server/client-build

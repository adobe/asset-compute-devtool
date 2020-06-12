#!/usr/bin / env node

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';

require('dotenv').config();

const app = require('./app.js');
const debug = require('debug')('server');
const http = require('http');
const open = require('open');
const getPort = require('get-port');
const crypto = require("crypto");

let port = process.env.ASSET_COMPUTE_DEV_PORT || '9000';

function run(portIncomming) {

    if (!isNaN(portIncomming)) {
        port = portIncomming;
    }

    let randomString;
    try {
        randomString = crypto.randomBytes(32).toString("hex");
    } catch (e) {
        console.log(e);
        throw new Error('Error: Not enough accumulated entropy to generate cryptographically strong data.');
    }

    // Get port from environment and store in Express.
    app.set('port', port);
    app.set('devToolToken', randomString);

    // Create HTTP server.
    const server = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', async () => {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
        if (process.env.ASSET_COMPUTE_DEV_TOOL_ENV !== 'development') {
            const assetComputeDevToolUrl = `http://localhost:${addr.port}/?devToolToken=${randomString}`;
            console.log('Asset Compute Developer Tool Server started on url ', assetComputeDevToolUrl);
            await open(assetComputeDevToolUrl);
        } else {
            console.log('Running in development mode.');
        }
    });
    server.on('close', () => {
        console.log("Asset Compute Developer Tool Server Stopped");
        process.exit();
    });
}

/**
 * Find open port
 */
async function findOpenPort(preferredPort) {
    // Will use specified port if available, otherwise fall back to a random port
    return getPort({ port: [preferredPort, preferredPort + 1, preferredPort + 2] });
}

/**
 * Event listener for HTTP server "error" event.
 */

async function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        port = await findOpenPort(port);
        run(port);
        break;
    default:
        throw error;
    }
}

module.exports.start = run;

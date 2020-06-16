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
const portfinder = require('portfinder');
const crypto = require("crypto");
const fse = require('fs-extra');


async function start(portPreferred) {
    let port = process.env.ASSET_COMPUTE_DEV_PORT || '9000';
    if (!isNaN(portPreferred)) {
        port = portPreferred;
    }

    const portRangeServer = {
        port: port, // minimum port
        stopPort: 9999 // maximum port
    };
    port = await findOpenPort(portRangeServer);

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

            // read/process package.json
            const file = '../client/package.json';
            const pkg = fse.readJSONSync(file, { throws: false });

            pkg.proxy = `http://localhost:${port}`;

            // Write to package.json
            fse.writeJSONSync(file, pkg, { spaces: '\t' });

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
async function findOpenPort(portRange) {

    // Find available server port
    const port = await portfinder.getPortPromise(portRange);
    return port;
}

/**
 * Event listener for HTTP server "error" event.
 */

async function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof this.port === 'string'
        ? 'Pipe ' + this.port
        : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

module.exports = { start };

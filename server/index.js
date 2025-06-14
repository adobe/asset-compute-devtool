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
const crypto = require('crypto');
const fse = require('fs-extra');
const yaml = require('js-yaml');

const DEFAULT_PORT = 9000;

class DevtoolServer {

    /**
     * Start server and open developer tool UI in a browser
     * @param {*} preferredPort preferred port to bind server, can be a number or string
     * 
     * preferredPort will take precedence over the default port and the environment variable port
     * however, if the requested port is taken, it will find and usethe closest open port
     */
    async run (preferredPort) {
        if(!validateCredentials()) {
            return;
        }

        this.port = process.env.ASSET_COMPUTE_DEV_PORT || DEFAULT_PORT;
        if (!isNaN(preferredPort)) {
            this.port = preferredPort;
        }
    
        const portRangeServer = {
            port: this.port, // minimum port
            stopPort: 9999 // maximum port
        };
        this.port = await findOpenPort(portRangeServer);

        const randomString = getRandomString();
    
        
    
        // Get port from environment and store in Express.
        app.set('port', this.port);
        app.set('devToolToken', randomString);
    
        // Create HTTP server.
        this.server = http.createServer(app);
    
        this.server.listen(this.port);
        this.server.on('error', error => {
            if (error.syscall !== 'listen') {
                throw new Error(error);
            }

            // handle specific listen errors with friendly messages
            const bind = typeof this.port === 'string'
                ? 'Pipe ' + this.port
                : 'Port ' + this.port;
            switch (error.code) {
            case 'EACCES':
                console.error(bind,  'requires elevated privileges');
                break;
            case 'EADDRINUSE':
                console.error(bind, ' is already in use');
                break;
            }
            throw new Error(error);
        });

        this.server.on('listening', () => onListening(this.server, randomString));
        this.server.on('close', () => {
            console.log("Asset Compute Developer Tool Server Stopped");
        });
    }

    async stop() {
        return this.server.close();
    }

}

/**
 * 
 * Validate credentials in .env file 
 */

function validateCloudStorageCredentials() {
    const hasAzureCredentials = process.env.AZURE_STORAGE_ACCOUNT && 
                               process.env.AZURE_STORAGE_KEY && 
                               process.env.AZURE_STORAGE_CONTAINER_NAME;
    
    const hasAwsCredentials = process.env.S3_BUCKET && 
                             process.env.AWS_ACCESS_KEY_ID && 
                             process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!hasAzureCredentials && !hasAwsCredentials) {
        console.error('Error: Missing some or all cloud storage credentials.');
        return false;
    }
    
    return true;
}

function validateIntegrationFileExists(integrationFile) {
    if (!integrationFile || !fse.existsSync(integrationFile)) {
        console.error('Error: Missing Adobe Developer Project details.');
        return false;
    }
    return true;
}

function validateYamlIntegration(integrationFile) {
    const yamlFile = yaml.safeLoad(fse.readFileSync(integrationFile, "utf-8"));
    if (!yamlFile.technicalAccount.privateKey) {
        console.error('Error: Missing Adobe Developer Project private key file.');
        return false;
    }
    return true;
}

function validateJsonIntegration(integrationFile, privateKeyFilePath) {
    const jsonFile = fse.readJSONSync(integrationFile, { throws: false });
    const workspace = jsonFile.project && jsonFile.project.workspace;
    
    if (!workspace) {
        console.error('Error: No workspace found in console.json');
        return false;
    }

    // Check for private key file first
    if (!privateKeyFilePath || !fse.existsSync(privateKeyFilePath)) {
        console.error('Error: Missing Adobe Developer Project private key file.');

        // Check for OAuth Server to Server credentials as fallback
        const hasOAuthCredentials = workspace.details && 
                                   workspace.details.credentials && 
                                   workspace.details.credentials.some(credential => 
                                       credential && credential.oauth_server_to_server
                                   );
        
        // Allow it pass if OAuth credentials are found, otherwise fail as no private key file is found
        if (hasOAuthCredentials) {
            console.log('Info: OAuth Server to Server credentials found.');
            return true;
        } else {
            console.error('Error: No credentials found.');
            return false;
        }
    }
    
    return true;
}

function validateCredentials() {
    // Validate cloud storage credentials
    if (!validateCloudStorageCredentials()) {
        return false;
    }
    
    // Validate integration file exists
    const integrationFile = process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH || 'console.json';
    if (!validateIntegrationFileExists(integrationFile)) {
        return false;
    }
    
    // Validate based on file type
    if (integrationFile.endsWith('.yaml') || integrationFile.endsWith('.yml')) {
        return validateYamlIntegration(integrationFile);
    } else if (integrationFile.endsWith('.json')) {
        const privateKeyFilePath = process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH;
        return validateJsonIntegration(integrationFile, privateKeyFilePath);
    }
    
    return true;
}

// for backwards compatibility
async function start(port) {
    const devtool = new DevtoolServer();
    await devtool.run(port);
    return devtool;
}

/**
 * Event listener for HTTP server "listening" event.
 */
async function onListening(server, randomString) {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
    if (process.env.ASSET_COMPUTE_DEV_TOOL_ENV !== 'development') {
        const assetComputeDevToolUrl = `http://localhost:${addr.port}/?devToolToken=${randomString}`;
        console.log('Asset Compute Developer Tool Server started on url', assetComputeDevToolUrl);
        await open(assetComputeDevToolUrl);
    } else {
        // read/process package.json
        const file = '../client/package.json';
        const pkg = fse.readJSONSync(file, { throws: false });

        pkg.proxy = `http://localhost:${addr.port}`;

        // Write to package.json
        fse.writeJSONSync(file, pkg, { spaces: 4 });

        console.log('Asset Compute Developer Tool Server started. Running in development mode.');
    }
}



/**
 * Get random string of bytes
 * @param {*} bytes 
 */
function getRandomString(bytes=32) {
    try {
        return crypto.randomBytes(bytes).toString("hex");
    } catch (e) {
        console.log(e);
        throw new Error('Error: Not enough accumulated entropy to generate cryptographically strong data.');
    }

}

/**
 * Find open port
 */
async function findOpenPort(portRange) {
    // Find available server port
    return portfinder.getPortPromise(portRange);
}

module.exports = {
    DevtoolServer,
    start
};

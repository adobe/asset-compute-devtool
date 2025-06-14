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
/*eslint no-unused-vars: "error"*/

"use strict";

const { AssetComputeClient, getIntegrationConfiguration } = require("@adobe/asset-compute-client");
const fse = require('fs-extra');
const { CloudStorage } = require('@adobe/cloud-blobstore-wrapper');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const child_process = require('child_process');

const DEFAULT_PRESIGN_TTL_MSEC = 60000 * 120; // 2 hours validity
const DEFAULT_ACTIVATION_WAIT_MSEC = 60000 * 120; // 2 hours to wait for activation
const DEFAULT_ENDPOINT = 'https://asset-compute.adobe.io';

const AIO_PROJECT_CREDENTIALS_PATH = path.join(process.cwd(),'console.json');

class AssetComputeDevTool {
    /**
     * Create Framework instance
     *
     * @param {AssetComputeClient} assetCompute Asset Compute Client
     * @param {ClouStorage} storage Cloud storage container (Azure or S3)
     */
    constructor(assetCompute, storage, expirationTime) {
        this.assetCompute = assetCompute;
        this.storage = storage;
        this.expirationTime = expirationTime || (Date.now() + 86400000); // 24 hours till asset compute access token expires
        this.presignGetTTL = DEFAULT_PRESIGN_TTL_MSEC;
        this.presignPutTTL = DEFAULT_PRESIGN_TTL_MSEC;
        this.activationWaitMsec =  DEFAULT_ACTIVATION_WAIT_MSEC;
        this.sourceStoragePath = 'source';
    }

    /**
     * Upload source files to source folder in Cloud Storage
     * @param {String}  file local file to be uploaded to the cloud
     */
    async uploadSourceToCloud(file) {
        await this.storage.upload(file.path, `${this.sourceStoragePath}/${file.name}`);
        return file.name;
    }

    /**
     * List source files from source folder in Cloud Storage
     */
    async listSourceObjects() {
        let files = await this.storage.listObjects();
        files = files.map((item) => {
            if (item.name.includes(`${this.sourceStoragePath}/`)) {
                return item.name.slice(7); // remove the `source/` prefix
            }
            return undefined;
        }).filter((name) => (name !== undefined) && (name.length > 0) );
        return files;
    }

    /**
     * Pre-sign an asset reference
     * @param {String} source Source file name
     * @return {Object} Source object for Asset Compute Processing
     */
    presignSource(source) {
        if (source) {
            return Object.assign({
                url: this.storage.presignGet(`${this.sourceStoragePath}/${source}`, this.presignGetTTL),
                name: source
            });
        } else {
            throw Error(`Invalid source file: ${source}`);
        }
    }

    /**
     * Generate a rendition path in the target container
     *
     * @param {String} source Source file name, may be null/undefined if there is no source file
     * @param {String} rendition Rendition name
     * @param {Number} idx Unique index
     * @returns {String} rendition path in target repository
     */
    getRenditionPath(source, rendition, idx) {
        if (rendition) {
            return `rendition/${source}/${this.id}/${idx}/${rendition}`;
        } else {
            return `rendition/${source}/${this.id}/${idx}/rendition`;
        }
    }

    /**
     * Retrieve the rendition path from a rendition_created or rendition_failed event
     *
     * @param {AssetComputeRenditionCreatedEvent|AssetComputeRenditionFailedEvent} event rendition event
     * @returns {String} rendition path in target repository
     */
    getRenditionPathFromEvent(event) {
        return event && event.rendition && event.rendition.userData && event.rendition.userData.path;
    }

    /**
     * Presign a set of renditions
     *
     * @param {String} source Source asset name, may be null/undefined if there is no asset
     * @param {AssetComputeRendition} rendition Rendition to presign
     * @param {Number} idx Unique index
     */
    presignRendition(source, rendition, idx) {
        const path = this.getRenditionPath(source, rendition.name, idx);
        const estimatedSize = 100*1024*1024; // for Azure mutlipart uploads
        const target = this.storage.presignPut(path, this.presignPutTTL, estimatedSize, 50);
        return {
            ...rendition,
            target,
            userData: {
                path
            }
        };
    }

    /**
     * Presign a set of renditions
     *
     * @param {String} source Source asset name
     * @param {AssetComputeRendition[]} renditions Renditions to create
     */
    presignRenditions(source, renditions) {
        return renditions.map((rendition, idx) =>
            this.presignRendition(source, rendition, idx)
        );
    }

    async isJournalReady() {
        return this.assetCompute.isEventJournalReady();
    }

    /**
     * Process an asset, waits for all rendition events to return
     *
     * @param {String} [source=] Source file name
     * @param {Object} renditions Renditions
     * @param {Object} [userData=] Optional user to pass through
     */
    async process(source, renditions, userData) {
        this.id = uuidv4();
        const presignedSource = this.presignSource(source);
        const presignedRenditions = this.presignRenditions(source, renditions);
        console.log('Calling /process with source:', presignedSource);
        console.log('Renditions:', presignedRenditions);
        const response = await this.assetCompute.process(
            presignedSource,
            presignedRenditions,
            userData
        );
        console.log(`>>> Request ID ${response.requestId} (Activation ${response.activationId})`);
        return { 
            response,
            request: {
                source: presignedSource,
                renditions: presignedRenditions 
            }
        };
    }
     
    async getEvents(requestId) {
        const events = await this.assetCompute.waitActivation(requestId, this.activationWaitMsec);
        await Promise.all(events.map(event => {
            if (event.type === "rendition_created") {
                try {
                    return this.storage.commitPut(event.rendition.userData.path);
                } catch (e) { // eslint-disable-line no-unused-vars
                    // ignore if cloud storage is an S3 bucket, `commitPut` not needed
                }
            }
            return null;
        }));
        return events;
    }
}

/**
 * Get the asset compute endpoint
 */
function getEndpoint() {
    let endpoint = process.env.ASSET_COMPUTE_URL || DEFAULT_ENDPOINT;
    
    // remove trailing slash if there is one
    try {
        if (endpoint && endpoint.endsWith('/')) {
            endpoint = endpoint.slice(0, -1);
        }
    } catch (error) {
        // ignore error if endpoint is null or undefined
    }
    return endpoint;
}

function getActionUrls() {
    try {
        /**
         * {
         *   "runtime": {
         *      "worker":"https://org-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker",
        *       "worker-1":"https://org-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker-1"
        *       }
        * }
         */
        const result = child_process.execSync('aio app get-url -j', {
            timeout: 10000
        });
        const runtimeUrls = result.toString().trim().split('\n').pop();
        const actionUrlsObj = JSON.parse(runtimeUrls).runtime;
        console.log('Got action urls:', actionUrlsObj);
        return actionUrlsObj;
    } catch (e) { /* eslint-disable-line no-unused-vars */
        // ignore error is not in the context of an aio app
        console.log('Issues getting custom worker action urls. Please ignore if not in the context of an aio app builder app.');
        return {};
    }
}

/**
 * Set up instance of Asset Compute Client
 */
async function setupAssetCompute() {
    let integrationFilePath = process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH;

    if (!integrationFilePath) {
        if (fse.existsSync(AIO_PROJECT_CREDENTIALS_PATH)) {
            integrationFilePath = AIO_PROJECT_CREDENTIALS_PATH;
        } else {
            return;
        }
    }

    // Check if this is a YAML file - if so, use traditional JWT integration
    if (integrationFilePath.endsWith('.yaml') || integrationFilePath.endsWith('.yml')) {
        console.log('Using traditional JWT integration');
        
        // For YAML files, use the getIntegrationConfiguration function
        const integration = await getIntegrationConfiguration(integrationFilePath);
        
        const options = {
            url: getEndpoint(),
            apiKey: process.env.DEV_TOOL_API_KEY // will default to `integration.technicalAccount.clientId` if environment variable is not set
        };

        const client = new AssetComputeClient(integration, options);
        await client.register();
        return client;
    }

    // Read the JSON file to determine integration type
    const jsonFile = fse.readJSONSync(integrationFilePath);
    const credentials = jsonFile.project && 
                       jsonFile.project.workspace && 
                       jsonFile.project.workspace.details && 
                       jsonFile.project.workspace.details.credentials;
    
    // Look for an oauth_server_to_server credential
    const oauthCredential = credentials && credentials.find(credential => 
        credential && credential.oauth_server_to_server
    );
    
    const isOAuthS2S = !!oauthCredential;
    let integration;

    // If an oauth_server_to_server credential is found, use it
    if (isOAuthS2S) {
        console.log('Using OAuth Server-to-Server integration');
        integration = {
            TYPE: 'oauthservertoserver',
            SCOPES: oauthCredential.oauth_server_to_server.scopes,
            CLIENT_SECRETS: oauthCredential.oauth_server_to_server.client_secrets,
            CLIENT_ID: oauthCredential.oauth_server_to_server.client_id,
            TECHNICAL_ACCOUNT_ID: oauthCredential.oauth_server_to_server.technical_account_id,
            TECHNICAL_ACCOUNT_EMAIL: oauthCredential.oauth_server_to_server.technical_account_email,
            ORG_ID: jsonFile.project.org.ims_org_id,
            technicalAccount: {
                org: jsonFile.project.org.ims_org_id,
            }
        };
    } else {
        // Traditional JWT-based integration - requires private key file
        console.log('Using traditional JWT integration');
        
        if (!process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH) {
            throw new Error('Traditional JWT integration requires ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH environment variable to be set');
        }
        
        // Get the integration configuration from the integration file using the asset compute client
        integration = await getIntegrationConfiguration(integrationFilePath);
    }

    const options = {
        url: getEndpoint(),
        apiKey: process.env.DEV_TOOL_API_KEY // will default to `integration.technicalAccount.clientId` if environment variable is not set
    };

    const client = new AssetComputeClient(integration, options);
    await client.register();
    return client;
}

/**
 * Returns an object that is an Cloud Storage container (either S3 or Azure Blob Storage) using the credentials in local storage
 * @return Cloud Storage container
 */
async function setupCloudStorage() {
    let storage;
    if (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY) {
        storage =  new CloudStorage({
            accountName: process.env.AZURE_STORAGE_ACCOUNT,
            accountKey: process.env.AZURE_STORAGE_KEY
        }, process.env.AZURE_STORAGE_CONTAINER_NAME);
    }
    else if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        storage = new CloudStorage(
            {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            process.env.S3_BUCKET,
            { bucketRegion: process.env.AWS_REGION }
        );
    }
    else {
        throw new Error("Neither AWS nor Azure cloud storage credentials were provided, please set credentials up for either AWS or Azure");
    }
    await storage.validate();
    return storage;
}

/**
 * Setup the dev tool framework.
 */
// singleton Promise
let devToolPromise;

async function setupAssetComputeDevTool() {
    if (devToolPromise) {
        return devToolPromise;
    }
    devToolPromise = new Promise((resolve) => {
        resolve(doSetupAssetComputeDevTool());
    });
    return devToolPromise;
}

async function doSetupAssetComputeDevTool() {
    const assetCompute = await setupAssetCompute();
    const expirationTime = Date.now() + 86400000;
    const storage = await setupCloudStorage();
    return new AssetComputeDevTool(assetCompute, storage, expirationTime);
}


module.exports = {
    setupAssetComputeDevTool,
    getEndpoint,
    getActionUrls,
    setupAssetCompute
};

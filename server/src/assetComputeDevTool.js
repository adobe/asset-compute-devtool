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

"use strict";

const { AssetComputeClient, getIntegrationConfiguration } = require("@adobe/asset-compute-client");
const yaml = require("js-yaml");
const fse = require('fs-extra');
const { CloudStorage } = require('@adobe/cloud-blobstore-wrapper');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DEFAULT_PRESIGN_TTL_MSEC = 60000 * 10; // 10 minutes validity
const DEFAULT_ACTIVATION_WAIT_MSEC = 60000 * 10; // 10 minutes to wait for activation
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
        const isReady = await this.assetCompute.isEventJournalReady();
        return isReady;
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
        return response;
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
    return process.env.ASSET_COMPUTE_URL || DEFAULT_ENDPOINT;
}

async function getActionUrls() {
    try {
        const namespace = process.env.AIO_RUNTIME_NAMESPACE || process.env.AIO_runtime_namespace;
        const manifest = yaml.safeLoad(await fse.readFile('manifest.yml', "utf-8"));
        const packageJson = await fse.readJson('package.json');


        return Object.entries(manifest.packages.__APP_PACKAGE__.actions).reduce((obj, [name]) => {
            obj[name] = `https://${namespace}.adobeioruntime.net/api/v1/web/${packageJson.name}-${packageJson.version}/${name}`;
            return obj;
        }, {});


    } catch (e) { /* eslint-disable-line no-unused-vars */
        // ignore error is not in the context of an aio app
        return {};
    }
}

/**
 * Set up instance of Asset Compute Client
 */
async function setupAssetCompute() {
    let integrationFilePath =  process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH;
    if (!integrationFilePath) {
        if (process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH && fse.exists(AIO_PROJECT_CREDENTIALS_PATH)) {
            integrationFilePath = AIO_PROJECT_CREDENTIALS_PATH;
        } else {
            return; 
        }
    }
    const integration = await getIntegrationConfiguration(integrationFilePath);

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

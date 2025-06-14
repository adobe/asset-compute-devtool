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

/* eslint-env mocha */
/* eslint mocha/no-mocha-arrows: "off" */

'use strict';

const assert = require('assert');
const fse = require('fs-extra');
const mock = require('mock-require');
const { getActionUrls } = require('../src/assetComputeDevTool');
const path = require('path');
const child_process = require('child_process');
const AIO_PROJECT_CREDENTIALS_PATH = path.join(process.cwd(),'console.json');

describe( 'assetComputeDevTool.js tests', () => {
    before(() => {
        delete process.env.AIO_RUNTIME_NAMESPACE;
        delete process.env.AIO_runtime_namespace;
        delete process.env.AIO_RUNTIME_AUTH;
        delete process.env.AIO_runtime_auth;

        delete process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH;
        delete process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH;
    });

    afterEach(() => {
        delete process.env.AIO_RUNTIME_NAMESPACE;
        delete process.env.AIO_runtime_namespace;
        delete process.env.AIO_RUNTIME_AUTH;
        delete process.env.AIO_runtime_auth;

        delete process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH;
        delete process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH;
        mock.stop('@adobe/asset-compute-client');
    });

    it('should set up Asset Compute DevTool client with integration yaml', async () => {
        // Create temporary test file
        await fse.writeFile('test-integration.yaml', `
technicalAccount:
  privateKey: dummy-key
`);
        
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH);
                assert.ok(!process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH); // no private key necessary when using yaml file format
            }
        });
        const { setupAssetCompute } = mock.reRequire('../src/assetComputeDevTool');
        process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH = 'test-integration.yaml';
        await setupAssetCompute();
        
        // Clean up
        await fse.remove('test-integration.yaml');
    });

    it('should set up Asset Compute DevTool client with integration json and path to private key', async () => {
        // Create temporary test files
        await fse.writeJSON('test-integration.json', {
            project: {
                org: { ims_org_id: 'test-org' },
                workspace: {
                    details: {
                        credentials: [{
                            jwt: { some: 'data' }
                        }]
                    }
                }
            }
        });
        await fse.writeFile('path-to-private-key.key', 'dummy-private-key');
        
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH);
                assert.equal('path-to-private-key.key', process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH);
            }
        });
        const { setupAssetCompute } = mock.reRequire('../src/assetComputeDevTool');
        process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH = 'test-integration.json';
        process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH = 'path-to-private-key.key';
        await setupAssetCompute();
        
        // Clean up
        await fse.remove('test-integration.json');
        await fse.remove('path-to-private-key.key');
    });

    it('should set up Asset Compute DevTool client with console.json from aio project and path to private key', async () => {
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, AIO_PROJECT_CREDENTIALS_PATH);
                assert.equal('path-to-private-key.key', process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH);
                assert.ok(!process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH); // no integration file, using `console.json` instead
            }
        });
        const { setupAssetCompute } = mock.reRequire('../src/assetComputeDevTool');
        process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH = 'path-to-private-key.key';
        await fse.writeJSON('console.json', {'dummyJson':'hello'});
        await setupAssetCompute();
        await fse.remove('console.json');
    });

    it('should fail to get action urls if not in the context of an aio action', async function() {
        const actionUrlsResult= ` ›   Error: Not a valid application root folder.
        ›   Please run 'aio app' commands from a folder generated by aio app init`;
        child_process._original_execSync = child_process.execSync;
        child_process.execSync = function () {
            console.log('Mocked execSync');
            return Buffer.from(actionUrlsResult, "utf-8");
        };
        const actionUrls = await getActionUrls();
        assert.ok(typeof actionUrls, 'object');
        assert.strictEqual(Object.keys(actionUrls).length, 0);
    }).timeout(3000);

    it('should get action urls successfully', async function() {
        const actionUrlsResult = `Using local project's @adobe/aio-cli-plugin-asset-compute version 2.0.0\n
        {"runtime":{"worker":"https://orgid-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker","worker-1":"https://orgid-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker-1"}}\n`;
        child_process._original_execSync = child_process.execSync;
        child_process.execSync = function () {
            console.log('Mocked execSync');
            return Buffer.from(actionUrlsResult, "utf-8");
        };

        const actionUrls = await getActionUrls();
        assert.strictEqual(Object.keys(actionUrls).length, 2);
        assert.ok(actionUrls["worker-1"], "https://orgid-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker-1");
        assert.ok(actionUrls.worker, "https://orgid-fakeproject-stage.adobeioruntime.net/api/v1/web/dx-asset-compute-worker-1/worker");

        child_process.execSync = child_process._original_execSync;
    });

    it('should create an instance of AssetComputeDevTool on setupAssetComputeDevTool', async() => {
        process.env.AZURE_STORAGE_ACCOUNT = 'AZURE_STORAGE_ACCOUNT';
        process.env.AZURE_STORAGE_KEY = 'AZURE_STORAGE_KEY';
        mock('@adobe/cloud-blobstore-wrapper', { 
            CloudStorage: class CloudStorageMock {
                validate() {}
            }
        });
        const { setupAssetComputeDevTool } = mock.reRequire('../src/assetComputeDevTool');
        const devToolPromise =  await setupAssetComputeDevTool();
        assert(devToolPromise);
    });

    it('should return boolean from AssetComputeClient isJournalReady', async () => {
        // Create temporary test file
        await fse.writeJSON('test-integration-journal.json', {
            project: {
                org: { ims_org_id: 'test-org' },
                workspace: {
                    details: {
                        credentials: [{
                            jwt: { some: 'data' }
                        }]
                    }
                }
            }
        });
        await fse.writeFile('test-private-key.key', 'dummy-private-key');
        
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
                isEventJournalReady() {
                    return true;
                } 
            }, getIntegrationConfiguration: function() { }
        });
        process.env.AZURE_STORAGE_ACCOUNT = 'AZURE_STORAGE_ACCOUNT';
        process.env.AZURE_STORAGE_KEY = 'AZURE_STORAGE_KEY';
        process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH = 'test-integration-journal.json';
        process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH = 'test-private-key.key';
        mock('@adobe/cloud-blobstore-wrapper', { 
            CloudStorage: class CloudStorageMock {
                validate() {}
            }
        });
        const { setupAssetComputeDevTool } = mock.reRequire('../src/assetComputeDevTool');
        const devToolPromise =  await setupAssetComputeDevTool();
        const isReady = await devToolPromise.isJournalReady();
        assert(isReady,true);
        
        // Clean up
        await fse.remove('test-integration-journal.json');
        await fse.remove('test-private-key.key');
    });
});

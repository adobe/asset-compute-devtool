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
const rewire = require('rewire');
const { getActionUrls } = require('../src/assetComputeDevTool');

// const path = require('path');
describe( 'assetComputeDevTool.js tests', () => {

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
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH);
            }
        });
        const rewiredAssetComputeDevTool = rewire('../src/assetComputeDevTool');
        const setupAssetCompute = rewiredAssetComputeDevTool.__get__('setupAssetCompute');
        process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH = 'test-integration.yaml';
        await setupAssetCompute();
    });

    it('should set up Asset Compute DevTool client with integration json and path to private key', async () => {
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH);
                assert.equal('path-to-private-key.key', process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH);
            }
        });
        const rewiredAssetComputeDevTool = rewire('../src/assetComputeDevTool');
        const setupAssetCompute = rewiredAssetComputeDevTool.__get__('setupAssetCompute');
        process.env.ASSET_COMPUTE_INTEGRATION_FILE_PATH = 'test-integration.json';
        process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH = 'path-to-private-key.key';
        await setupAssetCompute();
    });

    it('should set up Asset Compute DevTool client with console.json from aio project and path to private key', async () => {
        mock('@adobe/asset-compute-client', { 
            AssetComputeClient: class AssetComputeClientMock {
                register() {}
            }, getIntegrationConfiguration: function(integrationPath) {
                assert.equal(integrationPath, 'console.json');
                assert.equal('path-to-private-key.key', process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH);
            }
        });
        const rewiredAssetComputeDevTool = rewire('../src/assetComputeDevTool');
        const setupAssetCompute = rewiredAssetComputeDevTool.__get__('setupAssetCompute');
        process.env.ASSET_COMPUTE_PRIVATE_KEY_FILE_PATH = 'path-to-private-key.key';
        await fse.writeFile('console.json', {'dummyJson':'hello'});
        await setupAssetCompute();
        await fse.remove('console.json');
    });

    it('should fail to get action urls if not in the context of an aio action', async function() {


        const actionUrls = await getActionUrls();
        assert.ok(typeof actionUrls, 'object');
        assert.strictEqual(Object.keys(actionUrls).length, 0);
    }).timeout(3000);

    it('should get action urls successfully', async function() {
        process.env.AIO_RUNTIME_NAMESPACE = 'namespace';
        await fse.copy('./test/files/test-manifest.yml', 'manifest.yml');
        assert.ok(await fse.pathExists('manifest.yml'));

        const actionUrls = await getActionUrls();
        assert.strictEqual(Object.keys(actionUrls).length, 2);
        assert.ok(actionUrls["worker-example"], "https://105979_72515.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.0/worker-example");
        assert.ok(actionUrls.generic, "https://105979_72515.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.0/generic");
        await fse.remove('manifest.yml');
        assert.ok(!await fse.pathExists('manifest.yml'));
    });
});

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

describe( 'assetComputeDevTool.js tests', () => {

    afterEach(() => {
        delete process.env.AIO_RUNTIME_NAMESPACE;
        delete process.env.AIO_runtime_namespace;
        delete process.env.AIO_RUNTIME_AUTH;
        delete process.env.AIO_runtime_auth;
    });

    it('should fail to get action urls if not in the context of an aio action', async function() {

        const { getActionUrls } = require('../src/assetComputeDevTool'); // refresh cache to use mocked child_process defined above

        const actionUrls = await getActionUrls();
        assert.ok(typeof actionUrls, 'object');
        assert.strictEqual(Object.keys(actionUrls).length, 0);
    }).timeout(3000);

    it('should get action urls successfully', async function() {
        process.env.AIO_RUNTIME_NAMESPACE = 'namespace';
        await fse.copy('./test/files/test-manifest.yml', 'manifest.yml');
        assert.ok(await fse.pathExists('manifest.yml'));
        const { getActionUrls } = require('../src/assetComputeDevTool'); // refresh cache to use mocked child_process defined above

        const actionUrls = await getActionUrls();
        assert.strictEqual(Object.keys(actionUrls).length, 2);
        assert.ok(actionUrls["worker-example"], "https://105979_72515.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.0/worker-example");
        assert.ok(actionUrls.generic, "https://105979_72515.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.0/generic");
        await fse.remove('manifest.yml');
        assert.ok(!await fse.pathExists('manifest.yml'));
    });
});

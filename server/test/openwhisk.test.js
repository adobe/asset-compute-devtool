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
const mock = require('mock-require');

const AUTH = 'auth';
const NAMESPACE = 'namespace';

mock('openwhisk', (options) => {
    try {
        assert.equal(options.api_key, AUTH);
        assert.equal(options.namespace, NAMESPACE);
    } catch(e) {
        console.log('Error:', e.message);
        throw new Error(`Test failed. Credentials are not as expected`);
    }
    return {};
});
const { getWorkerLogs } = require('../src/openwhisk');

describe( 'openwhisk.js tests', () => {
    after(() => {
        mock.stopAll();
    });
    afterEach(() => {
        delete process.env.AIO_RUNTIME_NAMESPACE;
        delete process.env.AIO_runtime_namespace;
        delete process.env.AIO_RUNTIME_AUTH;
        delete process.env.AIO_runtime_auth;
    });

    it('should set up openwhisk agent successfully using old env variables', async function() {
        process.env.AIO_RUNTIME_NAMESPACE = NAMESPACE;
        process.env.AIO_RUNTIME_AUTH = AUTH;
        try {
            await getWorkerLogs();
        } catch (e) {
            assert.ok(!e.message.includes('Test failed'));
            // ignore errors after checking options
        }
    });

    it('should set up openwhisk agent successfully using new env variables', async function() {
        process.env.AIO_runtime_namespace = NAMESPACE;
        process.env.AIO_runtime_auth = AUTH;
        try {
            await getWorkerLogs();
        } catch (e) {
            assert.ok(!e.message.includes('Test failed'));
            // ignore errors after checking options
        }
    });
});

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

const {stdout} = require("stdout-stderr");
const assert = require("assert");
const mock = require('mock-require');
mock('open', () => {});

describe('index.js tests', () => {
    after(() => {
        mock.stopAll();
    });
    it('Just calling index', async function () {
        stdout.start();
        await require('../index.js');
        stdout.stop();

        // check start up logs
        console.log(stdout.output);
        assert.ok(stdout.output.includes('client-build'));
    });

    it('Passing a port number to index', async function () {
        await require('../index.js').start(8080);
    });

    it('Port in use', async function () {
        await require('../index.js').start(8080);
        await require('../index.js').start(8080);
    });
});

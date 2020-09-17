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
const promisify = require('util').promisify;
const sleep = promisify(setTimeout);
const fetch = require('node-fetch');
const mock = require('mock-require');
mock('open', () => {});
const { DevtoolServer, start } = require('../index.js');

const SERVER_START_UP_WAIT_TIME = 500; // ms to wait while server starts up
const SERVER_SHUTDOWN_TIME = 100; // ms to wait while server shuts down up
const TIMEOUT = 3000;

// Important Note: 
// A lot of these tests rely on ports 8080 and 2345 being open. 
// If you are currently using one or some of those ports locally, some of the unit tests will fail
describe('index.js tests', () => {
    after(() => {
        mock.stop('open');
    });
    afterEach(() => {
        delete process.env.ASSET_COMPUTE_DEV_TOOL_ENV;
        delete process.env.ASSET_COMPUTE_DEV_PORT;
    });
    it("devtool starts and serves html", async function() {
        // set up server
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run();
        await sleep(SERVER_START_UP_WAIT_TIME);
        const port = devtool.port;
        stdout.stop();
        
        // check start up logs
        const stdoutList = stdout.output.split('\n');
        assert(stdoutList[0].includes(`Asset Compute Developer Tool Server started on url http://localhost:${port}/?devToolToken=`));
        const url = stdoutList[0].split(' ').pop();
        assert.ok(url.includes(`http://localhost:${port}/?devToolToken=`));
        
        // api call to get raw html
        const resp = await fetch(url);
        console.log('Response from html for debugging', resp.status, resp.statusText, url);
        assert.strictEqual(resp.status, 200);
        const html = await resp.text();
        assert.ok(html.includes('/static/js'));
        await devtool.stop();
    });

    it("devtool starts and serves html in development mode", async function() {
        process.env.ASSET_COMPUTE_DEV_TOOL_ENV = 'development';
        // set up server
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run();
        await sleep(SERVER_START_UP_WAIT_TIME);
        const port = devtool.port;
        stdout.stop();
        
        // check start up logs
        assert.ok(stdout.output.includes('Asset Compute Developer Tool Server started. Running in development mode.'));
        
        // api call to get raw html
        const resp = await fetch(`http://localhost:${port}`);
        console.log('Response from html for debugging', resp.status, resp.statusText, `http://localhost:${port}`);
        assert.strictEqual(resp.status, 200);
        const html = await resp.text();
        assert.ok(html.includes('/static/js'));
        await devtool.stop();
    });


    it("server starts up and does an api call", async function() {
        this.timeout(TIMEOUT);
        // set up server
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run();
        await sleep(SERVER_START_UP_WAIT_TIME);

        // check output
        stdout.stop();
        const port = devtool.port;
        const stdoutList = stdout.output.split('\n');
        const url = stdoutList[0].split(' ').pop();
        const token = url.split('=')[1];
        assert.strictEqual(token.length, 64);
        assert.ok(url.includes(`http://localhost:${port}/?devToolToken=`));
        
        // api call to get raw html
        const resp = await fetch(`http://localhost:${port}/api/asset-compute-endpoint`, {
            headers: {
                "Authorization": token
            }
        });
        
        assert.strictEqual(resp.status, 200);
        const body = await resp.json();
        assert.ok(body.endpoint.includes('https://asset-compute.adobe.io'));
        await devtool.stop();
    });

    it("server starts up and fails an api call without authorization headers", async function() {
        this.timeout(TIMEOUT);
        // set up server
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run();
        await sleep(SERVER_START_UP_WAIT_TIME);

        // check output
        const port = devtool.port;
        stdout.stop();
        // api call to get raw html
        const resp = await fetch(`http://localhost:${port}/api/asset-compute-endpoint`, {
            headers: {
                "Authorization": "fake token",
            }
        });

        assert.strictEqual(resp.status, 401);
        assert.deepStrictEqual(await resp.json(), { message: 'Unauthorized' } );
        await devtool.stop();
    });

    it('Passing a port number as string to run server', async function () {
        this.timeout(TIMEOUT);
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run('8080');
        await sleep(SERVER_START_UP_WAIT_TIME);
        assert.strictEqual(devtool.port, 8080);
        await devtool.stop();
        await sleep(SERVER_SHUTDOWN_TIME);
        stdout.stop();

        const stdoutList = stdout.output.split('\n');
        assert(stdoutList[0].includes('Asset Compute Developer Tool Server started on url http://localhost:8080/?devToolToken='));
        assert(stdoutList[1].includes('Asset Compute Developer Tool Server Stopped'));
    });

    it('Using an environment variable for the port to run server', async function () {
        this.timeout(TIMEOUT);
        process.env.ASSET_COMPUTE_DEV_PORT = 8080;
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run();
        await sleep(SERVER_START_UP_WAIT_TIME);
        assert.strictEqual(devtool.port, 8080);
        await devtool.stop();
        await sleep(SERVER_SHUTDOWN_TIME);
        stdout.stop();

        const stdoutList = stdout.output.split('\n');
        assert(stdoutList[0].includes('Asset Compute Developer Tool Server started on url http://localhost:8080/?devToolToken='));
        assert(stdoutList[1].includes('Asset Compute Developer Tool Server Stopped'));
    });

    it('Passing an invalid port number to run server', async function () {
        this.timeout(TIMEOUT);
        stdout.start();
        const devtool = new DevtoolServer();
        await devtool.run('80invalid');
        await sleep(SERVER_START_UP_WAIT_TIME);
        assert.notStrictEqual(devtool.port, '80invalid');
        assert.ok((devtool.port >= 9000) && (devtool.port <= 9999) ); // in case port 9000 is taken, it will be between 9000, 9999
        await devtool.stop();
        await sleep(SERVER_SHUTDOWN_TIME);
        stdout.stop();

        const stdoutList = stdout.output.split('\n');
        assert(stdoutList[0].includes(`Asset Compute Developer Tool Server started on url http://localhost:${devtool.port}/?devToolToken=`));
        assert(stdoutList[1].includes('Asset Compute Developer Tool Server Stopped'));
    });
    
    describe('using start function', () => {
        it('start up devtool', async function () {
            const devtool = await start();
            assert.ok((devtool.port >= 9000) && (devtool.port <= 9999) ); // in case port 9000 is taken, it will be between 9000, 9999
            await devtool.stop();
        });

        it('Passing a port number to run server', async function () {
            const devtool = await start(8080);
            assert.strictEqual(devtool.port, 8080);
            await devtool.stop();
        });

        it('Check stopping the devtool actually ends the node process', async function () {
            this.timeout(TIMEOUT);
            const port = 2345;
            const devtool = await start(port);
            await sleep(SERVER_START_UP_WAIT_TIME);
            assert.strictEqual(devtool.port, port);
            await devtool.stop();

            const devtool2 = await start(port);
            await sleep(SERVER_START_UP_WAIT_TIME);
            assert.strictEqual(devtool2.port, port);
            await devtool2.stop();
        });
    
        it('Port in use', async function () {
            const devtool8080 = await start(8080);
            const devtoolNot8080 = await start(8080);
    
            assert.strictEqual(devtool8080.port, 8080);
            assert.notStrictEqual(devtoolNot8080.port, 8080);
            await devtool8080.stop();
            await devtoolNot8080.stop();
        });
    });

});

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
const assert = require('assert');
// const { promisify } = require('util');
// var exec = promisify(require('child_process').exec);
const mockRequire = require('mock-require');

describe( 'assetComputeDevTool.js tests', () => {
    afterEach(() => {
        mockRequire.stopAll();
    })
    
    it('should fail to get action urls if not in the context of an aio action', async function() {
        mockRequire('child_process', {
            exec: function(cmd, cb) {
                return cb(new Error("TypeError: Cannot read property 'actions' of undefined\n"));
            }
        });
        const { getActionUrls } = mockRequire.reRequire('../src/assetComputeDevTool'); // refresh cache to use mocked child_process defined above

        const actionUrls = await getActionUrls();
        assert.ok(typeof actionUrls, 'object')
        assert.strictEqual(Object.keys(actionUrls).length, 0);
    }).timeout(3000);
    
    it('should get action urls successfully', async function() {
        mockRequire('child_process', {
            exec: function(cmd, cb) {
                console.log('cmd', cmd);
                const response = {
                    stdout: '{"runtime":{"my-action":"https://1111.my-action.com/my-action","generic":"https://2222.generic.com/generic"}}\n',
                    stderr: ''
                  }
                return cb(undefined, response);
            }
        });
        const { getActionUrls } = mockRequire.reRequire('../src/assetComputeDevTool'); // refresh cache to use mocked child_process defined above

        const actionUrls = await getActionUrls();
        assert.strictEqual(Object.keys(actionUrls).length, 2);
        assert.ok(actionUrls["my-action"], "https://1111.my-action.com/my-actio");
        assert.ok(actionUrls.generic, "https://2222.generic.com/generic");
    });
});


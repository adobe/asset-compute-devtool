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

const fse = require('fs-extra');
const portfinder = require('portfinder');

const portRange = {
    port: process.env.ASSET_COMPUTE_DEV_PORT || 3000, // minimum port
    stopPort: 3333 // maximum port
};

// Find available server port
portfinder.getPortPromise(portRange)
    .then((port) => {

        // read/process package.json
        const file = '../client/package.json';
        const pkg = fse.readJSONSync(file, { throws: false });
        pkg.scripts.start = `PORT=${port} react-scripts start`;

        // Write to package.json
        fse.writeJSONSync(file, pkg, { spaces: '\t' });
    })
    .catch((err) => {
        throw new Error(err);
    });

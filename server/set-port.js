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

if (process.env.ASSET_COMPUTE_DEV_PORT) {
    // read/process package.json
    const file = '../client/package.json';
    const pkg = fse.readJSONSync(file, { throws: false });
    // at this point you should have access to your ENV vars
    pkg.proxy = `http://localhost:${process.env.ASSET_COMPUTE_DEV_PORT}`;

    // the 2 enables pretty-printing and defines the number of spaces to use
    fse.writeJSONSync(file, pkg, { spaces: '\t'});
}

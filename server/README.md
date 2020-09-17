[![Version](https://img.shields.io/npm/v/@adobe/asset-compute-devtool.svg)](https://npmjs.org/package/@adobe/asset-compute-devtool)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
<!-- [![Travis](https://travis-ci.com/adobe/asset-compute-devtool.svg?branch=master)](https://travis-ci.com/adobe/asset-compute-devtool) -->

# Asset Compute Development Tool
This is a library for the developer tool for exploring and testing the Adobe Asset Compute service.

## Installation

```
$ npm install @adobe/asset-compute-devtool
```

## Usage

The Devtool Server has a simple api for starting and stopping the server:
```js
const { DevtoolServer } = require('@adobe/asset-compute-devtool');

const devtool = new DevtoolServer();
await devtool.run(); // starts server and opens a browser
// ... use developer tool
await devtool.stop(); // stop server
```

Using a preferred port:
```js
const { DevtoolServer } = require('@adobe/asset-compute-devtool');

const devtool = new DevtoolServer();
await devtool.run(8080); // starts server and binds it to port 8080 or the closest port to 8080 if it is already in use
console.log(devtool.port); // should be 8080 unless that port was already in use
// ... use developer tool
await devtool.stop(); // stop server
```

Using start function to set up server:
```js
const { start } = require('@adobe/asset-compute-devtool');

const devtool = await start(); // create DevtoolServer instance and run server
// ... use developer tool
await devtool.stop();
```

See [adobe/aio-cli-plugin-asset-compute](https://github.com/adobe/aio-cli-plugin-asset-compute) for an example usage.

-----
## Further Documentation

Refer to [Asset Compute Development Tool](https://github.com/adobe/asset-compute-devtool#asset-compute-development-tool) for more information
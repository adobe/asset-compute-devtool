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

const express = require('express');
const router = express.Router();
const { getWorkerLogs } = require('../src/openwhisk');
const { setupAssetComputeDevTool, getEndpoint, getActionUrls} = require('../src/assetComputeDevTool');

let assetComputeDevTool;
let assetComputeStartTime = Date.now(); // eslint-disable-line no-unused-vars
const DEFAULT_PRESIGN_TTL_MSEC = 60000 * 60; // 60 minutes validity

router.get('/asset-compute-endpoint', async function(req, res) {
    res.json({
        endpoint: getEndpoint()
    });
});


router.get('/get-journal-url', async function(req, res) {
    try {
        if (!assetComputeDevTool) {
            assetComputeDevTool = await setupAssetComputeDevTool();
        }
    }  catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error setting up devtool - journal url'
        });
    }
    const journalUrl = assetComputeDevTool && assetComputeDevTool.assetCompute 
                            && assetComputeDevTool.assetCompute.journal;
    res.json({ journalUrl });
});

router.post('/check-jrnl-ready', async function(req, res) {
    const journalUrl = req.fields.journalUrl;
    try {
        if (!journalUrl) {
            throw new Error("assetComputeDevTool did not initialize");
        }
        const journalReady = await assetComputeDevTool.checkEventJornal(journalUrl);
        res.json({ journalReady });
    }  catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error checking journal ready'
        });
    }
});

router.get('/asset-compute-action-url', async function(req, res) {
    const urls = await getActionUrls();
    res.json(urls);
});

router.get('/cloudstorage-listObjects', async function(req, res) {
    if (!assetComputeDevTool) {
        assetComputeDevTool = await setupAssetComputeDevTool();
    }
    try {
        const objects = await assetComputeDevTool.listSourceObjects();
        res.json(objects);
    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error listing objects from Cloud Storage Container'
        });
    }
});

router.post('/cloudstorage-upload', async function(req, res) {
    if (!assetComputeDevTool) {
        assetComputeDevTool = await setupAssetComputeDevTool();
    }
    try {
        await assetComputeDevTool.uploadSourceToCloud(req.files.file);
    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error uploading file to Cloud Storage Container'
        });
    }
    console.log(`Successfully uploaded file: ${req.files.file.name}`);
    try {
        const objects = await assetComputeDevTool.listSourceObjects();
        res.json(objects);
    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error listing objects from Cloud Storage Container'
        });
    }
});

router.post('/cloudstorage-presign-get', async function(req, res) {
    let keyName;
    try {
        if (!assetComputeDevTool) {
            assetComputeDevTool = await setupAssetComputeDevTool();
        }
        keyName = req.fields.key;
        const preSignedGetUrl = assetComputeDevTool.storage.presignGet(keyName, DEFAULT_PRESIGN_TTL_MSEC);
        console.log(`Successfully generated presigned get url for ${keyName}`);
        res.json({ url: preSignedGetUrl });
    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: `Error getting Presigned Get url for file ${keyName}. Check cloud storage credentials`
        });
    }
});

router.post('/asset-compute-process', async function(req, res) {
    try {
        if (!assetComputeDevTool || (Date.now() >= assetComputeDevTool.expirationTime)) {
            assetComputeDevTool = await setupAssetComputeDevTool();
        }
        const source = req.fields.source;
        const renditions = JSON.parse(req.fields.renditions);

        assetComputeStartTime = Date.now();
        const response = await assetComputeDevTool.process(source, renditions);
        res.json(response);
    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: 'Error calling Asset Compute /process'
        });
    }
});

router.post('/asset-compute-getEvents', async function(req, res) {
    let requestId;
    try {
        if (!assetComputeDevTool || (Date.now() >= assetComputeDevTool.expirationTime)) {
            assetComputeDevTool = await setupAssetComputeDevTool();
        }

        requestId = req.fields.requestId;
        const response = await assetComputeDevTool.getEvents(requestId);
        res.json(response);

    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: `Error getting Adobe IO Events for requestId: ${requestId}`
        });
    }
});

router.post('/openwhisk-activationLogs', async function(req, res) {
    let activationId;
    try {
        activationId = req.fields.activationId;
        const events = req.fields.events && JSON.parse(req.fields.events);
        const response = await getWorkerLogs(activationId, events);
        res.json(response);

    } catch(e) {
        console.log(e);
        return res.status(500).send({
            message: `Error getting worker activation logs from core activationId: ${activationId}`
        });
    }
});

module.exports = router;

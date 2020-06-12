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

const fse = require('fs-extra');
const openwhisk = require('openwhisk');

const API_HOST = 'https://adobeioruntime.net';

async function getWskCredentials() {
    let apiKey, namespace;
    if (process.env.WSK_CONFIG_FILE) {
        const credentials = (await fse.readFile(process.env.WSK_CONFIG_FILE, {encoding:'utf8'})).split('\n');
        credentials.forEach(cred => {
            if (cred.startsWith('NAMESPACE')) {
                namespace = cred.split('=')[1];
            }
            if (cred.startsWith('AUTH')) {
                apiKey = cred.split('=')[1];
            }
        });
    } else if (process.env.AIO_RUNTIME_AUTH && process.env.AIO_RUNTIME_NAMESPACE) {
        apiKey = process.env.AIO_RUNTIME_AUTH;
        namespace = process.env.AIO_RUNTIME_NAMESPACE;
    }

    return openwhisk({
        apihost:API_HOST,
        api_key: apiKey,
        namespace: namespace
    });
}

async function getActivationLogs(wsk, activationId)  {
    const logs = await wsk.activations.logs({name: activationId});
    if (logs && logs.logs) {
        return {
            activationId: activationId,
            logs: logs.logs.join('\n')
        };
    }
}

/**
 * Gets activation ids from the result of Asset Compute `core` action
 * @param {Object} wsk openwhisk instance
 * @param {String} activationId activation id of the `core` action
 */
async function getActivationIds(wsk, activationId)  {
    const result = await wsk.activations.result({name: activationId});
    return result.result.activationIds;

}

// this can only be used if worker is deployed in same namespace as the Asset Compute Endpoint, aka first party workers
// the worker activation ids are in the result of the `core` action
/**
 * Get first party worker activation logs
 * @param {Object} wsk instance of openwhisk
 * @param {String} activationId core activation id
 */
async function getFirstPartyWorkerLogs(wsk, activationId)  {
    const activationLogs = [];
    try {
        console.log('get activations for core activation id: ', activationId);
        const activationIds = await getActivationIds(wsk, activationId);
        for (const id in activationIds) {
            try {
                console.log('getFirstPartyWorkerLogs activation id: ', activationIds[id]);
                const activationLog = await getActivationLogs(wsk, activationIds[id]);
                if(activationLog) {
                    activationLogs.push(activationLog);
                }
            } catch(err) {
                const errMsg = `FAILED getting activation logs for activationId: ${activationIds[id]} with ${err.statusCode} - \n ${err.message} \n`;
                console.log(err);
                //update activationLogs with error msg
                handleActivationLogError(errMsg, activationLogs, activationIds[id]);
            }
        }
    } catch(err) {
        const errMsg = `FAILED getting activation logs for activationId: ${activationId} with ${err.statusCode} - \n ${err.message} \n`;
        console.log(err);
        //update activationLogs with error msg
        handleActivationLogError(errMsg, activationLogs, activationId);
    }
    return activationLogs;
}

/**
 * populates activationLogs array to handle errors when fetching activation logs
 * @param {String} displayErrMessage error message
 * @param {Array} activationLogs array of activation logs
 * @param {String} id activation id
 */
async function handleActivationLogError(displayErrMessage, activationLogs, id) {
    activationLogs.push({
        activationId: id,
        logs: displayErrMessage
    });
}

/**
 * Get custom worker activation logs
 * @param {Object} wsk instance of openwhisk
 * @param {String} activationId core activation id
 * @return {Array} array of activation logs
 */
async function getCustomWorkerLogs(wsk, activationIds)  {
    const activationLogs = [];

    for (const id of activationIds) {
        try {
            console.log('getCustomWorkerLogs for activation id: ', id);
            const activationLog = await getActivationLogs(wsk, id);
            if(activationLog) {
                activationLogs.push(activationLog);
            }
        } catch(err) {
            const errMsg = `FAILED getting activation logs for activationId: ${id} with ${err.statusCode} - \n ${err.message} \n`;
            console.log(err);
            //update activationLogs with error msg
            handleActivationLogError(errMsg, activationLogs, id);
        }
    }
    return activationLogs;
}

// get worker logs for each worker
async function getWorkerLogs(activationId, events) {
    /* look through events and determine if a custom worker was called
     * currently in events only custom worker activationIds are returned by Asset Compute
     */
    const uniqueActivationIds = new Set();
    if(events && events.length > 0) {
        events.forEach(event => {
            if(event.activationIds) {
                event.activationIds.forEach(activation => uniqueActivationIds.add(activation));
            }
        });
    }
    const wsk = await getWskCredentials();
    /* if custom worker, get activation logs for all the activation ids found in events
     * (make sure its a set to avoid repeats)
     */
    let activationLogs = [];
    if(uniqueActivationIds.size > 0) {
        //we got some custom workers.
        console.log("getCustomWorkerLogs activationIDs :", uniqueActivationIds);
        activationLogs = await getCustomWorkerLogs(wsk,uniqueActivationIds);
    } else {
        // if not, then call getFirstPartyWorkerLogs
        console.log("getFirstPartyWorkerLogs core activationID :", activationId);
        activationLogs = await getFirstPartyWorkerLogs(wsk,activationId);
    }
    return activationLogs;
}

module.exports = {
    getFirstPartyWorkerLogs,
    getActivationLogs,
    getWorkerLogs
};

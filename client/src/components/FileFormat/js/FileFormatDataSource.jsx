/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import ListDataSource from '@react/react-spectrum/ListDataSource';

/**
 * Returns an object that provides the output formats and supported capabilities
 * grouped by category, input format.
 * 
 * Usage: result.get(category).input.get(format) -> { records: [] }
 * 
 * @param {Object} rawData Fetched data
 * @return Data grouped by category, format
 */
function groupByCategoryFormat(rawData) {
    const formatCategory = new Map();
    for (const category of rawData.categories) {
        for (const format of category.formats) {
            formatCategory.set(format, category.name);
        }
    }

    const result = new Map();
    for (const worker of rawData.workers) {
        for (const inputFormat of worker.input) {
            const category = formatCategory.get(inputFormat) || 'Not Categorized';
            const record = { 
                output: new Map((worker.output || []).map(x => [x, {
                    workerName: worker.name,
                    workerUrl: worker.url,
                    supported: "supported"
                }])),
                capabilities: new Map((worker.capabilities || []).map(x => [x, {
                    workerName: worker.name,
                    workerUrl: worker.url,
                    supported: "supported"
                }]))
            };

            const { input } = result.get(category) || { input: new Map() };
            const { records } = input.get(inputFormat) || { records: [] };
            records.push(record);
            input.set(inputFormat, { records });
            result.set(category, { input });
        }
    }
    return result;
}

/**
 * Merge two output format or capability maps to create a summary whether a given
 * output format or capability is supported for all input formats in a category.
 * 
 * @param {Map} map1 Output format or capability map
 * @param {Map} map2 Output format or capability map
 */
function mergeSummaryMaps(map1, map2) {
    const result = new Map();
    const keys = new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())]);
    for (const key of keys) {
        const value1 = map1.get(key);
        const value2 = map2.get(key);
        if (value1 && (value1.supported === 'supported') && value2 && (value2.supported === 'supported')) {
            result.set(key, {
                supported: 'supported'
            });
        } else {
            result.set(key, {
                supported: 'partially'
            });
        }
    }
    return result;
}

/**
 * For a given input format, generate a new output format and capability record
 * that contains which worker supports to given output format or capability. 
 * 
 * @param {Object} records Workers that support an input format
 */
function categoryInputSummary(records) {
    const result = {
        output: new Map(),
        capabilities: new Map()
    };
    for (const record of records) {
        for (const [key, value] of record.output) {
            if (!result.output.get(key)) {
                result.output.set(key, value);
            }
        }
        for (const [key, value] of record.capabilities) {
            if (!result.capabilities.get(key)) {
                result.capabilities.set(key, value);
            }
        } 
    }
    return result;
}

/**
 * Summarize the output and capabilities for a given category
 * 
 * @param {Map} input Map of format name -> object
 * @returns {Object} with merged output and capabilities.
 */
function categorySummary(input) {
    let result;
    for (const { records } of input.values()) {
        const record = categoryInputSummary(records);
        if (!result) {
            result = {
                output: new Map(record.output),
                capabilities: new Map(record.capabilities)
            }
        } else {
            result.output = mergeSummaryMaps(result.output, record.output);
            result.capabilities = mergeSummaryMaps(result.capabilities, record.capabilities);
        }
    }
    return result;
}

/**
 * Create data derived from the raw data for use in data source
 * 
 * @param {Object} rawData Data retrieved from workers
 */
function createDataSourceData(rawData) {
    const result = groupByCategoryFormat(rawData);
    for (const category of result.values()) {
        category.summary = categorySummary(category.input);
        for (const input of category.input.values()) {
            input.summary = categoryInputSummary(input.records);
        }
    }
    return result;
}

export default class FileFormatDataSource extends ListDataSource {

    constructor() {
        super();
        this.rawData = {};
        this.data = {};
        this.visibleCategories = new Set();
    }

    /**
     * Fetch file format support data
     */
    fetch() {
        const self = this;
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.responseType = 'json';
            request.open('GET', './workers.json');
            request.onload = () => {
                self.rawData = request.response;
                self.data = createDataSourceData(self.rawData);
                resolve();
            }
            request.onerror = () => {
                reject();
            }
            request.send();
        });
    }

    /**
     * Retrieve a set of output formats
     */
    getOutputFormats() {
        const result = new Set();
        for (const category of this.data.values()) {
            for (const outputFormat of category.summary.output.keys()) {
                result.add(outputFormat);
            }
        }
        return result;
    }

    /**
     * Retrieve a set of capabilities
     */
    getCapabilities() {
        const result = new Set();
        for (const category of this.data.values()) {
            for (const capability of category.summary.capabilities.keys()) {
                result.add(capability);
            }
        }
        return result;
    }

    /**
     * Load the data for the table
     * 
     * Contract: called after fetch()
     */
    async load() {
        const result = [];
        const categories = Array.from(this.data.keys()).sort();
        for (const categoryName of categories) {
            const category = this.data.get(categoryName);

            // category summary line
            result.push(Object.assign({},
                { category: categoryName },
                category.summary
            ));

            // input summary lines
            if (this.visibleCategories.has(categoryName)) {
                const inputFormats = Array.from(category.input.keys()).sort();
                for (const inputFormat of inputFormats) {
                    const input = category.input.get(inputFormat);
                    result.push(Object.assign({},
                        { input: inputFormat },
                        input.summary
                    ));
                }
            }
        }
        return result;
    }

    isCategoryVisible(category) {
        return this.visibleCategories.has(category);
    }

    toggleCategory(category) {
        if (this.visibleCategories.has(category)) {
            this.visibleCategories.delete(category);
        } else {
            this.visibleCategories.add(category);
        }
        super.reloadData();
    }

}

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

import React from 'react';
import { shallow, mount } from 'enzyme';
import ChangeAssetComputeProfileButton from '../ChangeAssetComputeProfileButton';
import Editor from '../Editor'
import AceEditor from 'react-ace';

const DEVTOOL_TOKEN = 'devtool-token';
const DEFAULT_RENDITIONS_TEXT  = {
    "renditions": [
        {
            "name": "rendition.xml",
            "fmt": "xmp"
        },
        {
            "name": "rendition.txt",
            "fmt": "txt"
        },
        {
            "name": "rendition.48.48.png",
            "fmt": "png",
            "wid": 48,
            "hei": 48
        },
        {
            "name": "rendition.319.319.png",
            "fmt": "png",
            "wid": 319,
            "hei": 319
        }
    ]
};
const CUSTOM_WORKER_RENDITIONS = {
    "renditions": [
        {
            "worker": "https://namespace.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.1/worker-example",
            "name": "rendition.jpg"
        },
        {
            "worker": "https://namespace.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.1/generic",
            "name": "rendition.jpg"
        }
    ]
};


describe('Editor', () => {

    afterEach(() => {
        localStorage.clear();
        fetch.resetMocks();
    });

    it('Editor renders without crashing', () => {
        const wrapper = shallow(<Editor/>);

        // this component has ChangeAssetComputeProfileButton and AceEditor
        expect(wrapper.find(ChangeAssetComputeProfileButton)).toHaveLength(1);
        expect(wrapper.find(AceEditor)).toHaveLength(1);
        expect(JSON.parse(wrapper.state('textArea'))).toEqual(DEFAULT_RENDITIONS_TEXT);
    });

    it('Displays action urls as renditions after mounting', () => {
        const workerURLs = {
            'worker-example': 'https://namespace.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.1/worker-example',
            generic: 'https://namespace.adobeioruntime.net/api/v1/web/@adobe/asset-compute-devtool-1.0.1/generic' 
        };
        fetch.mockResponseOnce(JSON.stringify(workerURLs))
        mount(<Editor onChange={(v) => {expect(JSON.parse(v)).toEqual(CUSTOM_WORKER_RENDITIONS)}} devToolToken={DEVTOOL_TOKEN} />)

        //assert on the times called and arguments given to fetch
        expect(fetch.mock.calls.length).toEqual(1);
        expect(fetch.mock.calls[0][0]).toEqual('/api/asset-compute-action-url');
        expect(fetch.mock.calls[0][1]).toEqual({
            method: 'GET',
            headers: {
                Authorization: DEVTOOL_TOKEN
            },
        }
        );
    })

    it('Displays default renditions after mounting (not in the context of aio)', () => {
        fetch.mockResponseOnce(JSON.stringify({}));
        const wrapper = mount(<Editor onChange={(v) => { expect(JSON.parse(v)).toEqual(DEFAULT_RENDITIONS_TEXT);}} devToolToken={DEVTOOL_TOKEN} />);

        //assert on the times called and arguments given to fetch
        expect(fetch.mock.calls.length).toEqual(1);
        expect(fetch.mock.calls[0][0]).toEqual('/api/asset-compute-action-url');
        expect(fetch.mock.calls[0][1]).toEqual({
            method: 'GET',
            headers: {
                Authorization: DEVTOOL_TOKEN
            },
        }
        );
    })

    it('Simulate a text changed event', () => {
        const wrapper = shallow(<Editor onChange={(v) => {return v;}} devToolToken={DEVTOOL_TOKEN} />);
        wrapper.find(AceEditor).simulate('change', JSON.stringify(CUSTOM_WORKER_RENDITIONS));
        expect(JSON.parse(wrapper.state('textArea'))).toEqual(CUSTOM_WORKER_RENDITIONS);

    })

    it('Simulate a different Asset Compute profile selected event', () => {
        const renditions = {
            renditions: [
                {
                    name: 'test-rendition.jpg',
                    fmt:'jpg'
                }
            ]
        }
        const wrapper = shallow(<Editor onChange={(v) => {return v;}} devToolToken={DEVTOOL_TOKEN} />);
        wrapper.find(ChangeAssetComputeProfileButton).simulate('changeProfile', JSON.stringify(renditions));
        expect(JSON.parse(wrapper.state('textArea'))).toEqual(renditions);

    })

});
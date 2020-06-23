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
import "regenerator-runtime/runtime.js";
import { shallow, mount } from 'enzyme';

import Well from '@react/react-spectrum/Well';
import Button from '@react/react-spectrum/Button';
import OverlayTrigger from '@react/react-spectrum/OverlayTrigger';
import Popover from '@react/react-spectrum/Popover';
import ComboBox from '@react/react-spectrum/ComboBox';
import ChooseFileBox from '../ChooseFileBox';
import { wrap } from 'regenerator-runtime/runtime.js';

const DEVTOOL_TOKEN = 'devtool-token';
describe('ChooseFileBox', () => {

    afterEach(() => {
        localStorage.clear();
        fetch.resetMocks();
    });

    it('renders without crashing', () => {
        const wrapper = shallow(<ChooseFileBox/>);

        // check components and initial state
        expect(wrapper.find(Well)).toHaveLength(1);
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(ComboBox)).toHaveLength(1);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
        expect(wrapper.find(Popover)).toHaveLength(1);
        expect(wrapper.state('selectedOption')).toEqual(null);
        expect(wrapper.state('fileChoices')).toEqual([""]);
    });

    it('mounts and gets list of cloud storage objects', () => {
        const files = ['file1.jpg', 'file2.png', 'file3.tif'];
        fetch.once(files);

        const props = {
            devToolToken: DEVTOOL_TOKEN,
            onError: jest.fn(),
            onChange: jest.fn()
        }
        mount(<ChooseFileBox {...props} />);

        //assert on the times called and arguments given to fetch
        expect(fetch.mock.calls.length).toEqual(1);
        expect(fetch.mock.calls[0][0]).toEqual('/api/cloudstorage-listObjects');
        expect(fetch.mock.calls[0][1]).toEqual({
            headers: {
                Authorization: DEVTOOL_TOKEN
            },
        });
    })

    it('mounts with selected option', () => {
        fetch
        .once(['file1.jpg', 'file2.png', 'file3.tif'])
        .once('https://azure-presigned-url.com/file.png')

        const props = {
            devToolToken: DEVTOOL_TOKEN,
            onChange: jest.fn(),
            onError: jest.fn()
        }
        localStorage.selectedFile = 'file1.jpg';
        const wrapper = mount(<ChooseFileBox {...props} />);
        expect(wrapper.state('selectedOption')).toBe('file1.jpg')

        //assert on the times called and arguments given to fetch
        expect(fetch.mock.calls.length).toEqual(2);
        expect(fetch.mock.calls[0][0]).toEqual('/api/cloudstorage-listObjects');
        expect(fetch.mock.calls[1][0]).toEqual('/api/cloudstorage-presign-get');
        expect(fetch.mock.calls[0][1]).toEqual({
            headers: {
                Authorization: DEVTOOL_TOKEN
            },
        }
        );
        expect(fetch.mock.calls[1][1]).toMatchObject({
            method: 'POST',
            headers: {
                Authorization: DEVTOOL_TOKEN
            }
        });
    })

});
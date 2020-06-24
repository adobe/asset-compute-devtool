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
import { shallow } from 'enzyme';
import ChangeAssetComputeProfileButton from '../ChangeAssetComputeProfileButton';
import DropdownButton from '@react/react-spectrum/DropdownButton';
import { MenuItem } from '@react/react-spectrum/Menu';

const STANDARD_AEM_PROFILE = {
    "renditions": [
        {
            "name": "cqdam.metadata.xml",
            "fmt": "xmp",
            "cqDamAttributes": true
        },
        {
            "name": "cqdam.text.txt",
            "fmt": "txt"
        },
        {
            "name": "cq5dam.thumbnail.48.48.png",
            "fmt": "png",
            "wid": 48,
            "hei": 48
        },
        {
            "name": "cq5dam.thumbnail.140.100.png",
            "fmt": "png",
            "wid": 140,
            "hei": 100
        },
        {
            "name": "cq5dam.thumbnail.319.319.png",
            "fmt": "png",
            "wid": 319,
            "hei": 319
        },
        {
            "name": "cq5dam.web.1280.1280.png",
            "fmt": "jpg",
            "wid": 1280,
            "hei": 1280
        }
    ]
}

describe('ChangeAssetComputeProfileButton', () => {

    it('ChangeAssetComputeProfileButton has requested components', () => {
        const wrapper = shallow(<ChangeAssetComputeProfileButton/>);

        expect(wrapper.find(DropdownButton)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(4);
    });

    it('ChangeAssetComputeProfileButton -> DropdownButton has 4 children', () => {
        const wrapper = shallow(<ChangeAssetComputeProfileButton/>);

        const dropDownButton = wrapper.find(DropdownButton);
        const children = dropDownButton.children();
        expect(children).toHaveLength(4);
        expect(wrapper.find(MenuItem)).toHaveLength(4);
    });

    it('ChangeAssetComputeProfileButton -> Choose Standard AEM Profile', () => {
        const wrapper = shallow(<ChangeAssetComputeProfileButton onChangeProfile={(v) => { 
            expect(v).toEqual(STANDARD_AEM_PROFILE);
        }}/>);

        // Similate selecting the Standard AEM Profile
        const dropDownButton = wrapper.find(DropdownButton);
        const standardAemProfile = wrapper.find(MenuItem).first().props().value;
        // onSelect will return the value of the standard AEM Profile
        dropDownButton.simulate('select', JSON.parse(standardAemProfile));
    });
});
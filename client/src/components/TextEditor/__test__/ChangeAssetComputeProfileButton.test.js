  
/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2020 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

import React from 'react';
import { shallow } from 'enzyme';
import ChangeAssetComputeProfileButton  from '../ChangeAssetComputeProfileButton.jsx'
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
        //console.log('wrapper', wrapper);

        // this component has DropdownButton and MenuItem
        expect(wrapper.find(DropdownButton)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(4);
    });

    it('ChangeAssetComputeProfileButton -> DropdownButton has 4 children', () => {
        const wrapper = shallow(<ChangeAssetComputeProfileButton/>);

        // this component has DropdownButton and MenuItem
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
        dropDownButton.simulate('select', JSON.parse(standardAemProfile));
    });
});
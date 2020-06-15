  
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
import { ChangeAssetComputeProfileButton } from './ChangeAssetComputeProfileButton.test'

describe('ChangeAssetComputeProfileButton', () => {

    it('ChangeAssetComputeProfileButton renders correctly', () => {
        const wrapper = shallow(<ChangeAssetComputeProfileButton/>);
        console.log('wrapper', wrapper);
        // expect(wrapper.find(ModalTrigger)).toHaveLength(1);

        // const button = wrapper.find(Button);

        // expect(button).toHaveLength(1);
        // expect(button.prop('aria-label')).toBe('Delete');
    });

});
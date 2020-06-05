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

import React, { Component } from 'react';

import '@react/react-spectrum/page';
import DropdownButton from '@react/react-spectrum/DropdownButton';
import { MenuItem } from '@react/react-spectrum/Menu';

// OS
import ChevronDown from '@spectrum-icons/workflow//ChevronDown';



const STANDARD_AEM_PROFILE = JSON.stringify({
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
}, undefined, 4);

const SIMPLE_REQUEST = JSON.stringify({
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
}, undefined, 4);

const CUSTOM_WORKER = JSON.stringify({
    "renditions": [
        {
            "worker": "CUSTOM_WORKER_WEB_ACTION_URL",
            "name": "image.jpg"
        }
    ]
}, undefined, 4);

const ZIP_WORKER = JSON.stringify({
    "renditions": [
        {
            "name": "rendition.zip",
            "fmt": "zip",
            "files": [
                "PATH_TO_FILE_OR_URLS"
            ]
        }
    ]
}, undefined, 4);


export default class ChangeAssetComputeProfileButton extends Component {
    selectProfile(v) {
        return this.props.onChangeProfile(v);
    }

    render() {

        return (

            <DropdownButton
                onSelect={this.selectProfile.bind(this)}
                label="Choose from pre-existing Asset Compute Profile"
                style={{marginTop:-15}}
                icon={<ChevronDown/>}>
                <MenuItem value={STANDARD_AEM_PROFILE}>
                    Standard AEM Profile
                </MenuItem>
                <MenuItem value={SIMPLE_REQUEST}>
                    Simple Request
                </MenuItem>
                <MenuItem value={CUSTOM_WORKER}>
                    Custom Worker
                </MenuItem>
                <MenuItem value={ZIP_WORKER}>
                    ZIP Worker
                </MenuItem>
            </DropdownButton>

        )
  }}
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

// v3
import {Well} from '@react-spectrum/well';
import {ActionButton} from '@react-spectrum/button';
import {Icon} from '@react-spectrum/icon';
import AddCircle from '@spectrum-icons/workflow//AddCircle';
import Image from '@spectrum-icons/workflow//Image';

// v2
import OverlayTrigger from '@react/react-spectrum/OverlayTrigger';
import Popover from '@react/react-spectrum/Popover';
import ComboBox from '@react/react-spectrum/ComboBox';

export default class ChooseFileBox extends Component {
    constructor(props){
        super(props);
        this.state = {
            fileChoices: [""],
            selectedOption:localStorage.selectedFile || null,
            image:<Image size='M'/>
        }
    }

    async callListObjectsAPI() {

        let resp;
        try {
            resp = await fetch("/api/cloudstorage-listObjects", {
                headers: {
                    Authorization: this.props.devToolToken
                }
            });
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/cloudstorage-listObjects');
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`called cloud storage successfully`);
            this.setState({
                fileChoices:resp
            });
        } catch(e) {
            console.log(e);
            this.handleApiErrors(e.message);
        }
    }

    async callUploadToCloudApi(file) {

        let resp;
        try {
            const data = new FormData();
            data.append('file',file, file.name);

            resp = await fetch("/api/cloudstorage-upload", {
                method: 'POST',
                headers: {
                    Authorization: this.props.devToolToken
                },
                body: data
            })
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/cloudstorage-upload');
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Successfully uploaded ${file.name} to cloud.`);
            this.setState({
                fileChoices:resp
            });
        } catch(e) {
            console.log(e);
            this.handleApiErrors(e.message);
        }
    }

    async callPresignUrlApi(key) {

        let resp;
        try {
            const data = new FormData();
            data.append('key',key);
            resp = await fetch("/api/cloudstorage-presign-get", {
                method: 'POST',
                headers: {
                    Authorization: this.props.devToolToken
                },
                body: data
            })
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/cloudstorage-presign-get')
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Successfully got presigned get url for ${key}, ${resp.url}`);
            return resp.url;
        } catch(e) {
            console.log(e);
            this.handleApiErrors(e.message);
        }
    }

     // Attempt to read error message if it is formatted properly
     async formatErrorMessage(resp, api) {
        try {
            return (await resp.json()).message;
        } catch (e) {
            // ignore if response is not JSON formatted and use default error message instead
            return `Error fetching ${api}: ${resp.status} ${resp.statusText}`;
        }
    }

    handleApiErrors(message) {
        return this.props.onError(message);
    }

    async componentDidMount() {
        this.callListObjectsAPI();
        if (this.state.selectedOption) {
            var photo = await this.callPresignUrlApi(this.state.selectedOption);
            var im =<img style={{maxWidth:'200px', maxHeight:'200px'}} src={photo} alt={this.state.selectedOption}/>;
            if (this.state.selectedOption.includes('pdf')) {
                im = <embed width="200" height="207" name="plugin" src={photo} type="application/pdf"/>
            }
            this.setState({ image:im });
        }
    }

    // when upload button is clicked, upload file to Cloud Storage
    async onUpload() {
        var file = this._file.files[0];
        await this.callUploadToCloudApi(file);
}

    hideToast() {
        this.setState({error:''})
    }

    async handleOptionChange(v) {
        var photo = await this.callPresignUrlApi(v);
        var im =<img style={{maxWidth:'200px', maxHeight:'200px'}} src={photo} alt={v}/>;
        if (v.includes('pdf')) {
            im = <embed width="200" height="207" name="plugin" src={photo} type="application/pdf"/>
        }
        this.setState({selectedOption:v, image:im});
        return this.props.onChange(v);
    }

    handleTextChange(v) {
        this.setState({selectedOption:v});
    }

    render () {
        return (
            <div>
            <Well UNSAFE_style={{display:'inline-block'}}>
            <ActionButton id="file-chooser" isQuiet marginRight='size-75' onPress={(e) => {this._file.click()}}>
                <Icon >
                <AddCircle size='M'/>
                </Icon>
            </ActionButton>
            <ComboBox
                options={this.state.fileChoices}
                placeholder="Select a file..."
                value ={this.state.selectedOption}
                onSelect={this.handleOptionChange.bind(this)}
                onChange={this.handleTextChange.bind(this)}
            />
            <span style={{position:'fixed', top:'33px', left:'290px'}} id='ChooseFileButton' />
            <input id="myInput" type="file" onChange={this.onUpload.bind(this)} ref={(ref) => this._file = ref} style={{display:'none'}} />
            <OverlayTrigger  trigger="hover" disabled={!this.state.selectedOption} placement="right">
             <ActionButton  marginLeft='size-100'  disabled={!this.state.selectedOption} isQuiet >
                <Icon><Image size='M'/></Icon>
            </ActionButton>
                <Popover>
                 {this.state.image}
                </Popover>
             </OverlayTrigger>
             </Well>
            <p style={{marginRight:300, marginLeft:20, bottom:4, position:'fixed', zIndex:'10'}}>{this.state.error}</p>
            </div>
        )
    }
}

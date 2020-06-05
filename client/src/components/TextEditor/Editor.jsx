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
import AceEditor from 'react-ace';
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/mode-json";
import 'ace-builds/src-noconflict/theme-tomorrow_night_eighties'
import ChangeAssetComputeProfileButton from './ChangeAssetComputeProfileButton';

const DEFAULT_RENDITIONS_TEXT  = JSON.stringify({
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

Object.filter = (obj, predicate) =>
Object.keys(obj)
    .filter( key => predicate(obj[key]) )
    // eslint-disable-next-line
    .reduce( (res, key) => (res[key] = obj[key], res), {} );

export default class Editor extends Component {
    constructor(props){
        super(props);
        this.state = {
            textArea: localStorage.getItem('json') || DEFAULT_RENDITIONS_TEXT
        }
        this.handleChange = this.handleChange.bind(this);

    }

    async getDefaultRenditionJSON() {
        let resp;
        try {
            resp = await fetch("/api/asset-compute-action-url", {
                method: 'GET',
                headers: {
                    Authorization: this.props.devToolToken
                }
            });
            resp = await resp.json();
        } catch (e) {
            // ignore errors if not running in context of aio
        }
        let customWorkerRenditions;
        if (resp && typeof resp === 'object' && Object.keys(resp).length > 0 ) {
            let renditions = [];
            Object.values(resp).forEach(action => {
                renditions.push({
                    worker: action,
                    name: 'rendition.jpg'
                })
            });
            customWorkerRenditions = JSON.stringify(Object.assign({
                renditions
            }), null, 4);
        }
        const textArea = customWorkerRenditions || localStorage.getItem('json') || DEFAULT_RENDITIONS_TEXT;
        this.setState({
            textArea: textArea,
        })
        localStorage.setItem('json', textArea);
        return this.props.onChange(textArea);
    }
    componentDidMount() {
        this.getDefaultRenditionJSON();
    }

    handleChange(v) {
        this.setState({textArea:v})
        localStorage.setItem('json', v)
        return this.props.onChange(v)
    }

    // adding new rendtion to ace editor via form
    addRendition(rendition) {
        // get new rendition from rendition form
        console.log(rendition)
        rendition = Object.filter(rendition, i => i.length > 0)

        if (JSON.stringify(rendition) === '{}') {return;}

        // add rendition to ace editor text area
        var old = JSON.parse(this.state.textArea);
        old.renditions[old.renditions.length] = rendition
        const newTextArea = JSON.stringify(old, undefined, 2);
        return this.handleChange(newTextArea);
    }
    changeProfile(v) {
        this.handleChange(v);
    }

    render() {
        return (
            // <div>
            <div id="text-wrap" style={{marginTop:20}}>
            <ChangeAssetComputeProfileButton id='ChangeAssetComputeProfileButton' onChangeProfile={this.changeProfile.bind(this)} style={{float:'right'}}/>
                <AceEditor 
                    style={{position:'relative', zIndex:'0', borderRadius:'5px', overflow:'scroll'}}
                    ref='aceEditor'
                    id='editor'
                    value={this.state.textArea}
                    mode="json"
                    theme="tomorrow_night_eighties"
                    height="700px"
                    width="650px"
                    onChange={(v) => this.handleChange(v)}
                    readOnly={false}
                    name="json-editor"
                    editorProps={{$blockScrolling:Infinity}}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        fontSize: '15px'
                      }}
                    commands={[{
                        name:'run',
                        bindKey: {win:'Command-Enter', mac:'Command-Enter'},
                        exec: () => {this.props.onRun();} //command+enter runs Asset Compute /process
                        },
                    ]}
                />
                 </div>
        )



    }
}
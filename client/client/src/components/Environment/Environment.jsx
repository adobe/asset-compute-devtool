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
import StatusLight from '@react/react-spectrum/StatusLight'
import DropdownButton from '@react/react-spectrum/DropdownButton';
import {MenuItem} from '@react/react-spectrum/Menu';
import Tooltip from '@react/react-spectrum/Tooltip';
import {Toast} from '@react/react-spectrum/Toast';
import OverlayTrigger from '@react/react-spectrum/OverlayTrigger/js/OverlayTrigger';

const lights = {'prod':'celery', 'stage':'info',  'qe': 'notice', 'dev':"yellow", 'custom':"magenta"}
const ENVIRONMENTS = { prod: "asset-compute.adobe.io",
                    stage: "asset-compute-stage.adobe.io",
                    qe: "asset-compute-qe.adobe.io",
                    dev:`asset-compute-dev.adobe.io/`,
                    custom:'custom' }

export default class Environment extends Component {
    constructor(props){
      super(props);
      this.state = {
          status: this.props.env || localStorage.env || 'stage',
          color: localStorage.color || 'info',
          dev: this.props.dev || localStorage.dev,
          endpoint: ENVIRONMENTS[this.props.dev] || ENVIRONMENTS.stage,
          error: '',
      }
    }
    hideToast() {
        this.setState({error:''})
    }

    select(v) {
        if (v.substring(0,3) === 'dev' &&  (!this.state.dev || this.state.dev.length <=0)) {
            this.setState({error: <Toast closable onClose={this.hideToast.bind(this)} variant="error">
            Error! Please set the development environment name in settings
            </Toast>})
            return;
        }
        else if (v.substring(0,3) === 'dev') {
            this.setState({status:v, color:'yellow', endpoint: `${ENVIRONMENTS.dev}${this.props.dev}`});
            localStorage.setItem('color', 'yellow');
            localStorage.setItem('endpoint', `${ENVIRONMENTS.dev}${this.props.dev}`)
        }
        else {
            this.setState({status:v, color:lights[v], endpoint: ENVIRONMENTS[v]});
            console.log('changing enviroment to ', v)
            localStorage.setItem('color', lights[v]);
            localStorage.setItem('endpoint', ENVIRONMENTS[v])
        }
        localStorage.setItem('env', v);
    }
    render() {
      return (
      <div><div style={this.props.style}>

           <DropdownButton
                onSelect={this.select.bind(this)}
                icon={<StatusLight alt='env' style={{color: 'rgba(202, 202, 202, 0.815)'}} variant={this.state.color}>{this.state.status}</StatusLight>}>

                    <MenuItem id="asset-compute.adobe.io" value="prod">
                    <OverlayTrigger trigger="hover" placement='right'>
                        <StatusLight id="asset-compute.adobe.io" variant="celery">prod</StatusLight>
                    <Tooltip  style={{marginTop:'-21px'}} title={null}>asset-compute.adobe.io</Tooltip>
                    </OverlayTrigger>
                    </MenuItem>

                    <MenuItem id="asset-compute-stage.adobe.io" value="stage">
                    <OverlayTrigger trigger="hover" placement='right'>
                        <StatusLight id="asset-compute-stage.adobe.io" variant="info">
                            stage
                        </StatusLight>
                    <Tooltip title={null}>asset-compute-stage.adobe.io</Tooltip>
                    </OverlayTrigger>
                    </MenuItem>

                    <MenuItem id="asset-compute-qe.adobe.io" value="qe">
                    <OverlayTrigger trigger="hover" placement='right'>
                        <StatusLight id="asset-compute-qe.adobe.io" variant="notice">
                            qe
                        </StatusLight>
                    <Tooltip title={null}>asset-compute-qe.adobe.io</Tooltip>
                    </OverlayTrigger>
                    </MenuItem>

                    <MenuItem id={`asset-compute-dev.adobe.io/${this.props.dev}`} value={"dev " + this.props.dev}>
                    <OverlayTrigger trigger="hover" placement='right'>
                            <StatusLight id={`asset-compute-dev.adobe.io/${this.props.dev}`} variant="yellow">
                            dev
                            </StatusLight>
                    <Tooltip title={null}>asset-compute-dev.adobe.io/{this.props.dev}</Tooltip>
                    </OverlayTrigger></MenuItem>

                    <MenuItem id='custom' value="custom">
                    <OverlayTrigger trigger="hover" placement='right'>
                        <StatusLight variant="magenta">
                           custom
                        </StatusLight>
                        <Tooltip title={null}>{localStorage.getItem('openwhisk-url')}</Tooltip>
                    </OverlayTrigger>
                    </MenuItem>

            </DropdownButton>
      </div>
    <p style={{marginRight:300, marginLeft:20, bottom:4, position:'fixed'}}>{this.state.error}</p>
    </div>

            );
  }}

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

// Importing react-spectrum
import React from 'react';

// Importing react-spectrum components
import Well from '@react/react-spectrum/Well';
import Button from '@react/react-spectrum/Button';
import {Toast} from '@react/react-spectrum/Toast';
import Heading from '@react/react-spectrum/Heading';
import {Image} from '@react/react-spectrum/Image';
import {Accordion, AccordionItem} from '@react/react-spectrum/Accordion';
import {Grid, GridColumn, GridRow} from '@react/react-spectrum/Grid';
import Editor from './components/TextEditor/Editor';
import ChooseFileBox from './components/FileChooser/ChooseFileBox';
import Rendition from './components/RenditionDisplay/Rendition';
import logo from './images/nui-flower.png';

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

export default class NormalDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.state= {
            running:false,
            renditions:[],
            rendNames:[],
            rendData:[],

            lastVal:'',
            oldStart:0,
            command:false,

            runTutorial:false,
            dev: localStorage.dev,
            env: localStorage.env,
            textArea: localStorage.getItem('json') || DEFAULT_RENDITIONS_TEXT,
            selectedOption: localStorage.selectedFile || null,
            devToolToken: this.getDevToolToken()
        };
        this.run = this.run.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.hideToast = this.hideToast.bind(this);
    }

    getDevToolToken() {
        try {
            return window.location.search.substring(1).split('=')[1];
        } catch (e) {
            // ignore if error getting dev tool token
        }
    }

    async callGetAssetComputeEndpoint() {
        if (this.isAborted) return;
        let resp;
        try {
            resp = await fetch("/api/asset-compute-endpoint", {
                method: 'GET',
                headers: {
                    Authorization: this.state.devToolToken
                }
            });
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, 'Asset Compute Endpoint');
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Using Asset Compute endpoint: ${resp.endpoint}`);
            this.setState({
                endpoint: resp.endpoint
            });
            return resp.endpoint;
        } catch (e) {
            console.log(e);
            this.handleApiErrors(e.message);
        }
    }

    componentDidMount() {
        this.callGetAssetComputeEndpoint();
    }

    hideToast() {
        this.setState({ error: undefined });
    }
    abort() {
        const message = "Processing has been aborted";
        this.setState({
            running: false,
            renditions: [],
            rendNames: [],
            rendData: [],
            json: null,
            logs: undefined,
            error: <Toast closable onClose={this.hideToast} variant="error">{message} </Toast>

        });

        this.isAborted = true;
    }

    async callPresignUrlApi(key) {

        if (this.isAborted) return;

        var resp;
        try {
            var data = new FormData();
            data.append('key', key);
            console.log('calling Cloud Storage presign get');
            resp = await fetch("/api/cloudstorage-presign-get", {
                method: 'POST',
                headers: {
                    Authorization: this.state.devToolToken
                },
                body: data
            });
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/presign-get')
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Successfully got presigned get url for ${key}, ${resp.url}`);
            return resp.url;
        } catch (e) {
            console.log(e);
            return this.handleApiErrors(e.message);
        }
    }

    async callAssetComputeApi(source, renditions) {

        if (this.isAborted) return;

        var resp;
        try {
            var data = new FormData();
            data.append('source',source);
            data.append('renditions', JSON.stringify(renditions));
            console.log('calling asset compute /process');
            resp = await fetch("/api/asset-compute-process", {
                method: 'POST',
                headers: {
                    Authorization: this.state.devToolToken
                },
                body: data
                });
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/process')
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            return resp;
        } catch(e) {
            console.log(e);
            return this.handleApiErrors(e.message);
        }
    }

    async callAssetComputeEventsApi(requestId) {

        if (this.isAborted) return;

        var resp;
        try {
            var data = new FormData();
            data.append('requestId', requestId);
            console.log('getting events');
            resp = await fetch("/api/asset-compute-getEvents", {
                method: 'POST',
                headers: {
                    Authorization: this.state.devToolToken
                },
                body: data
            });
            if (!resp.ok) {
                const errorMessage = await (resp, '/getEvents')
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Successfully got events`);
            return resp;
        } catch (e) {
            console.log(e);
            return this.handleApiErrors(e.message);
        }
    }

    async callOpenWhiskLogsApi(activationId, events) {

        if (this.isAborted) return;

        var resp;
        try{
            var data = new FormData();
            data.append('activationId', activationId);
            data.append('events', JSON.stringify(events));
            resp = await fetch("/api/openwhisk-activationLogs", {
                method: 'POST',
                headers: {
                    Authorization: this.state.devToolToken
                },
                body: data
                });
            if (!resp.ok) {
                const errorMessage = await this.formatErrorMessage(resp, '/activationLogs')
                throw new Error(errorMessage);
            }
            resp = await resp.json();
            console.log(`Successfully got activation logs`);
            return resp;
        } catch(e) {
            console.log(e);
            return this.handleApiErrors('Error getting OpenWhisk activation logs');
        }
    }

    handleApiErrors(message, running=false) {
        if (!this.state.error) {
            this.setState(
                {
                    error: <Toast closable onClose={this.hideToast.bind(this)} variant="error">{message} </Toast>
                }
            );
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

    formatActivationLogs(logs) {
        // used to format the width for the activation logs
        if (!this.isAborted && logs) {
            const currentWidth = document.getElementById('activationLogs').offsetWidth;
            const headings = logs.map(log => {
                console.log('log: ', log);
                return <span>
                    <br />
                    <Heading variant="subtitle2">>>>>>>>>>>> Start of Activation Id: {log.activationId}</Heading>
                    <code >{log.logs}</code>
                    <Heading variant="subtitle2">>>>>>>>>>>> End of Activation Id: {log.activationId}</Heading>
                    <br />
                </span>
            });
            console.log('headings: ', headings);
            return <pre style={{ maxHeight: '400px', overflow: 'scroll', maxWidth: `${currentWidth - 20}px`, fontSize: '12px' }}>{headings}</pre>
        }
        return;
    }

    formatRequestDisplay(source, requestJSON, response) {
        return <pre style={{overflow:'scroll', fontFamily:'Source Code Pro', fontSize:'12px'}}>
                    <Heading size={6}>Request:</Heading>{`POST ${this.state.endpoint}\n`}
                    <br/>{JSON.stringify(Object.assign({}, {source: source}, requestJSON), undefined, 1)}<br/>
                    <br/>
                    <Heading size={6}>Response:</Heading>
                    {JSON.stringify({ activationId: response.activationId, requestId: response.requestId}, undefined, 2)}
                </pre>
    }

    async run() {
        this.isAborted = false;
        this.setState({
            renditions: [],
            error: null,
            runTutorial: false,
            running: true,
            logs: undefined
        });
        // name all the renditions and create presigned put urls
        try {
            const requestJSON = JSON.parse(this.state.textArea);
            const source = this.state.selectedOption;
            const response = await this.callAssetComputeApi(source, requestJSON.renditions);
            const renditions = [];

            console.log("Response from /process:", JSON.stringify(response, null, 2));
            if (!response) {
                return; // process failed so just return
            }

            if (!this.isAborted) {
                const jsonResponse = this.formatRequestDisplay(source, requestJSON, response);
                this.setState({
                    json: jsonResponse,
                    renditions: Array(requestJSON.renditions.length + 1).join('0').split('').map(parseFloat)
                });
            }

            const events = await this.callAssetComputeEventsApi(response.requestId);

            if (this.isAborted) return;
            await Promise.all(events.map(async event => {

                if (event.type === "rendition_created") {
                    // get presigned url for event.rendition.name
                    const presignURL = await this.callPresignUrlApi(event.rendition.userData.path);

                    if (!this.isAborted) {
                        renditions.push({
                            name: event.rendition.name,
                            url: presignURL,
                            fmt: event.rendition.fmt
                        });
                    }
                } else {
                    if (!this.isAborted) {
                        renditions.push({
                            name: event.rendition.name,
                            fmt: event.rendition.fmt,
                            errorMessage: event.errorMessage,
                            errorReason: event.errorReason
                        });
                    }
                }
            }));

            if (this.isAborted) return;

            this.setState({
                running:false,
                renditions: renditions,
                activationId:response.activationId
            });

            const logs = await this.callOpenWhiskLogsApi(response.activationId, events);
            const formatedLogs = this.formatActivationLogs(logs);

            if (!this.isAborted && formatedLogs) {
                this.setState({
                    logs: formatedLogs
                });
            }
        } catch(err) {
            this.setState({
                running:false
            });
            console.log(err);
            return this.handleApiErrors('Unexpected error. Check source file or request JSON.');
        }
    }

    handleTextChange(v) {
        this.setState({textArea: v});
    }

    handleSelectedFileChange(f) {
        this.setState({selectedOption:f});
        localStorage.setItem('selectedFile', f);
        console.log('selected file changed', this.state.selectedOption, f)
    }

    render() {
        var main =
        <Grid id="main">
            <GridRow>
                <GridColumn size="auto">
                <div  style={{ marginTop:'53px',
                            minWidth: '500px', marginBottom: '1em',
                            overflow: 'scroll',
                            padding: '1rem'}}>
                        {/* choose file and add new file */}
                        <ChooseFileBox id="ChooseFileBox" onChange={this.handleSelectedFileChange.bind(this)} devToolToken={this.state.devToolToken} onError={this.handleApiErrors.bind(this)}/>
                        <Button id="run" label="Run" variant="cta" style={{marginTop:15, marginLeft:10}} disabled={!this.state.selectedOption || this.state.running} onClick={this.run}/>
                        <span id="tourStepThree" style={{position:"fixed", top:'35px', left:'420px'}}/>
                        <Button id='Abort' label="Abort" variant="warning" style={{marginTop:15, marginLeft:10}} disabled={!this.state.running} onClick={this.abort.bind(this)}/>

                        <Editor onChange={(v) => {this.handleTextChange(v)}} devToolToken={this.state.devToolToken} onRun={this.run}/>

                    </div>
                </GridColumn>
                <GridColumn size="auto">
                <div  style={{ marginTop:'53px',
                            position: 'relative',
                            minWidth: '400px',
                            marginBottom: '1em',
                            overflow: 'scroll',
                            padding: '1rem'}}>
                    <Accordion>
                        <AccordionItem  header="Request/Response" disabled={!this.state.json}>
                            <div style={{paddingTop:'30px'}}>{this.state.json}</div>
                        </AccordionItem>
                    </Accordion>
                    <Accordion id='activationLogs'>
                        <AccordionItem  header="Activation Logs" disabled={!this.state.logs}>
                                {this.state.logs}
                        </AccordionItem>
                    </Accordion>
                    <Well style={{marginTop:40}}>
                        <Heading size={5}>Renditions</Heading>
                        <Rendition renditions={this.state.renditions} metadata={this.state.rendData} names={this.state.rendNames}/>
                    </Well>
                </div>
                </GridColumn>
            </GridRow>
        </Grid>
        return (
        <div >
            <title>Adobe Asset Compute</title>
            <ul className="top-bar">
                <Image id='flower' style={{width:'25px', height:'25px', float:'left', marginTop:'13px', marginRight:'10px'}} alt='flower' src={logo}/>
                <Heading size={2} style={{position:"fixed", left:'60px'}}>Adobe Asset Compute</Heading>
            </ul>
        {main}
        <p style={{marginRight:300, marginLeft:20, bottom:4, position:'fixed'}}>{this.state.error}</p>
        </div>
        )
    }
}

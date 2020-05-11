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
import Button from '@react/react-spectrum/Button';
import Tour from '@react/react-spectrum/Tour';
import CoachMark from '@react/react-spectrum/CoachMark';

export default class AddRend extends Component {
    constructor(props){
      super(props);
      this.state={
          tourStarted:false,
      }
      this.endTour = this.endTour.bind(this);

    }

    startTour() {
        console.log('tour started')
        this.setState({tourStarted:true})
    }
    endTour() {
        console.log('tour ended')
        this.setState({tourStarted:false})
    }
    render() {

        if (!this.state.tourStarted) {
            return (
                   <Button  modaltrigger variant='secondary'  onClick={this.startTour.bind(this)} quiet label='Help' style={{float:'right', marginTop:'7px'}} />
                )
        }

        return(
            <div>
                <div
                    style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                    }}>
                    <Button style={{display:'none'}} id="stepThree">Step Three</Button>
                    <Button style={{display:'none'}} id="stepFour" onClick={this.endTour.bind(this)}>Step Four</Button>
                    <Tour
                     >

                    <CoachMark
                        title="Uploading and Choosing a file "
                        selector="#ChooseFileButton"
                        placement="right top"
                        confirmLabel="Next"
                        cancelLabel="Skip"
                        onCancel={this.endTour}
                        quiet
                    >
                    Select a file from the Cloud Storage container or choose a new file to upload.
                    </CoachMark>

                    <CoachMark
                        title="Renditions"
                        selector="#Abort"
                        confirmLabel="Next"
                        cancelLabel="Skip"
                        placement="right bottom"
                        onCancel={this.endTour}
                        quiet
                    >
                    Type your renditions directly into the editor or fill out the form below to generate the rendition request
                    </CoachMark>
                    <CoachMark
                        title="Run Asset Compute"
                        selector="#tourStepThree"
                        dismissible={true}
                        onConfirm={this.endTour}
                        quiet
                        confirmLabel="Done"
                    >
                    <p>Press <b>Run</b> to see your renditions come to life! See the request, response, and generated renditions to the right. </p>
                    </CoachMark>
                    </Tour>
                </div>
            </div>
        )

    }

}

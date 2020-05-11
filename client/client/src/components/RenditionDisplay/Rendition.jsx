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
import {Card, CardCoverPhoto, CardBody, CardPreview, CardFooter} from '@react/react-spectrum/Card';
import {Asset} from '@react/react-spectrum/Asset';
import Wait from '@react/react-spectrum/Wait';
import Link from '@react/react-spectrum/Link';
import errorPlaceHolder from '../../images/renditionFailedPlaceHolder.png';
import path from 'path';

const EMBEDDED_EXT = ['.txt', '.text', '.xml', '.pdf', '.json'];
const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.gif']
export default class Rendition extends Component {
    render() {
        const renditions = this.props.renditions.map((rendition) => {
            let image ='';
            let title, type, footer;
            if (rendition === 0 ) {
                image = <div style={{height:'136px', marrginBottom:'20px'}}><Wait centered/></div>
            } else {
                title = rendition.name;
                type = rendition.fmt;
                const ext = path.extname(rendition.name);
                if (rendition.errorMessage) {
                    image = <CardPreview >
                                <Asset type="image" src={errorPlaceHolder} />
                            </CardPreview>
                    footer = <CardFooter >
                                <code>
                                    {rendition.errorReason}: {rendition.errorMessage}
                                </code>
                             </CardFooter>
                }
                else if (ext && (ext.length > 0) && IMAGE_EXT.includes(ext)) {
                    image = <Link href={rendition.url} variant="quiet" target="_blank" >
                                <CardCoverPhoto src={rendition.url} />
                            </Link>
                }
                else if (ext && (ext.length > 0) && EMBEDDED_EXT.includes(ext)) {
                    if (rendition.name.includes('text') || rendition.name.includes('txt')) { type = 'text/plain; charset=UTF-8'}
                    if (rendition.name.includes('json')) { type = 'application/json'}
                    if (rendition.name.includes('xml')) { type = 'application/xml'}
                    image = <CardPreview>
                                <Link href={rendition.url} target="_blank">
                                <Asset type="file" style={{width:'238px', height:'136px'}} src={rendition.url} />
                                </Link>
                            </CardPreview>
                    //  <CardPreview>
                    //     <a href={rendition.url}  target="_blank" rel="noopener noreferrer" style={{display:'inline-block'}}>
                    //      <embed width='100px' height='100px' name="plugin" style={{width:'238px', height:'136px', backgroundColor:'grey', pointerEvents:'none'}} src={rendition.url} type={type}/>
                    //     </a>
                    //     </CardPreview>
                }
                else {
                    image = <CardPreview>
                            <Link href={rendition.url} target="_blank">
                            <Asset type="file" style={{width:'238px', height:'136px'}} />
                            </Link>
                            </CardPreview>
    
                }

            }

            return (
                <Card allowsSelection={false} style={{marginRight:'15px', marginBottom:'15px', maxWidth:'300px', maxHeight:'300px', overflow:'scroll'}}>
                {image}
                <CardBody title={title} subtitle={type}/>
                {footer}
                </Card>

            )

        }

        )
        return (
            <div>
            {renditions}
            </div>
        )
    }
}


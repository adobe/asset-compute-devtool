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

// import ReactDOM from 'react-dom';
import React from 'react';
import Button from '@react/react-spectrum/Button';
import Link from '@react/react-spectrum/Link';
import { TableView } from '@react/react-spectrum/TableView';
import OverlayTrigger from '@react/react-spectrum/OverlayTrigger';
import Popover from '@react/react-spectrum/Popover';
import Checkmark from "@react/react-spectrum/Icon/Checkmark";
import FileFormatDataSource from './FileFormatDataSource';

export default class FileFormatTable extends React.Component {

    state = {
        columns: []
    }

    constructor(props) {
        super(props);
        this.dataSource = new FileFormatDataSource();
        this.renderCell = this.renderCell.bind(this);
    }

    async componentDidMount() {
        await this.dataSource.fetch();
        const columns = [{
            title: 'category',
            key: 'category',
            width: 160,
            divider: true
        }, {
            title: 'input',
            key: 'input',
            divider: true
        }];
        const outputFormats = Array.from(this.dataSource.getOutputFormats().keys()).sort();
        for (const output of outputFormats) {
            columns.push({
                title: output,
                key: output,
                type: 'output'
            })
        }
        if (outputFormats.length) {
            columns[columns.length - 1].divider = true;
        }
        const capabilities = Array.from(this.dataSource.getCapabilities().keys()).sort();
        for (const capability of capabilities) {
            columns.push({
                title: capability,
                key: capability,
                type: 'capability'
            })
        }
        this.setState({ columns });
    }

    renderCell(column, data) {
        if (column.key === 'category' && data.category) {
            return <Button 
                        variant='action' 
                        quiet
                        selected={this.dataSource.isCategoryVisible(data.category)} 
                        onClick={this.dataSource.toggleCategory.bind(this.dataSource, data.category)} 
                    >{data.category}</Button>;
        } else if (column.key === 'input' && data.input) {
            return data.input;
        } else if (column.type === 'output') {
            const output = data.output.get(column.key);
            if (output && output.supported === 'supported') {
                if (output.workerName) {
                    return <OverlayTrigger trigger="click" placement='right'>
                        <Button variant="action" quiet icon={<Checkmark size='S'/>}/>
                        <Popover>Implemented by <Link href={output.workerUrl}>{output.workerName}</Link></Popover>
                    </OverlayTrigger>
                } else {
                    return <Button variant="action" quiet icon={<Checkmark size='S'/>}/>
                }
            } else if (output && output.supported === 'partially') {
                return <span style={{'opacity': '0.5'}}><Button variant="action" quiet icon={<Checkmark size='S'/>}/></span>
            } else {
                return "";
            }
        } else if (column.type === 'capability') {
            const capability = data.capabilities.get(column.key);
            if (capability && capability.supported === 'supported') {
                if (capability.workerName) {
                    return <OverlayTrigger trigger="click" placement='right'>
                        <Button variant="action" quiet icon={<Checkmark size='S'/>}/>
                        <Popover>Implemented by <Link href={capability.workerUrl}>{capability.workerName}</Link></Popover>
                    </OverlayTrigger>
                } else {
                    return <Button variant="action" quiet icon={<Checkmark size='S'/>}/>
                }
            } else if (capability && capability.supported === 'partially') {
                return <span style={{'opacity': '0.5'}}><Button variant="action" quiet icon={<Checkmark size='S'/>}/></span>
            } else {
                return "";
            }
        }
    }

    // sections?

    render() {
        if (!this.state.columns.length) {
            return "Fetching file format data..."
        } else {
            return <TableView
                    allowsSelection={false}
                    columns={this.state.columns}
                    dataSource={this.dataSource}
                    renderCell={this.renderCell} />
        }
    }

}

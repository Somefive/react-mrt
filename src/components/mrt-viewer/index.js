import React from 'react'
import _ from 'lodash'
import './index.css'
import DefaultConfig from './default-config.json'
import DataView from './data-view'
import { Renderer } from './renderer'
import DataLayout from './data-layout'

export default class MRTViewer extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        this.config = {...DefaultConfig, ...this.props.config}
        performance.mark("dataView start")
        const dataView = new DataView(this.props.data, this.props.userEdits, this.config)
        performance.measure("dataView total", "dataView start")
        performance.mark("dataLayout start")
        const dataLayout = new DataLayout(this.config, dataView)
        performance.measure("dataLayout total", "dataLayout start")
        return <Renderer
            config={dataLayout.config} authors={this.props.authors}
            defs={dataLayout.defs}
            root={dataLayout.root} grid={dataLayout.grid} edges={dataLayout.edges} eras={dataLayout.eras} ncols={dataLayout.ncols} links={dataLayout.links}
            clusterBottomLabels={dataLayout.clusterBottomLabels} clusterTopLabels={dataLayout.clusterTopLabels}
            horizon={dataLayout.horizon} _width={dataLayout._width} gradientY={dataLayout.gradientY} bottomY={dataLayout.bottomY}
            layout={dataLayout} userEdits={this.props.userEdits}
            onEditChange={this.props.onEditChange}
        />
    }
}
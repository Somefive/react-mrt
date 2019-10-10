import React from 'react'
import MRTViewer from './mrt-viewer'
import { Icon } from 'antd'
import chroma from 'chroma-js'
import './index.css'
import svgLib from 'save-svg-as-png'

export default class MRT extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            userEdits: this.props.userEdits || {},
            like: this.props.like || false,
            viewerScale: 100,
            hideSubBranch: false,
            disableTextClusterSpan: false,
        }
    }

    like() {
        this.setState({...this.state, like: !this.state.like})
    }

    capture(full) {
        if (full)
            svgLib.saveSvgAsPng(document.getElementById("mrt-viewer"), `master-reading-tree.png`)
        else {
            const srcWidth = document.getElementById("mrt-viewer").viewBox.baseVal.width
            const outputWidth = document.body.clientWidth
            svgLib.saveSvgAsPng(document.getElementById("mrt-viewer"), `master-reading-tree-snapshot.png`, {scale: outputWidth / srcWidth})
        }
    }

    zoom(out) {
        this.setState({...this.state, viewerScale: Math.min(Math.max(this.state.viewerScale + (out ? -10 : 10), 100), 1000)})
    }

    render() {
        return (
            <div className="mrt-container" style={{width: `${this.state.viewerScale}%`}}>
                <div className="mrt-toolbox">
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.like()}>
                        <Icon type="heart" theme={this.state.like ? "filled" : "twoTone"}
                            twoToneColor={chroma("red").luminance(0.5).hex()}
                            style={{color: chroma("red").luminance(0.5).hex()}}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => {}}>
                        <Icon type="share-alt" theme="outlined" style={{color: chroma("green").luminance(0.3).hex()}}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.capture(true)}>
                        <Icon type="file-image" theme="twoTone" twoToneColor={chroma("orange").luminance(0.3).hex()}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.capture(false)}>
                        <Icon type="camera" theme="twoTone" twoToneColor={chroma("blue").luminance(0.3).hex()}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.zoom(true)}>
                        <Icon type="zoom-out" theme="outlined" style={{color: chroma("yellow").luminance(0.3).hex()}}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.zoom(false)}>
                        <Icon type="zoom-in" theme="outlined" style={{color: chroma("yellow").luminance(0.3).hex()}}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.setState({...this.state, hideSubBranch: !this.state.hideSubBranch})}>
                        <Icon type={`eye${this.state.hideSubBranch ? "" : "-invisible"}`} theme="twoTone" twoToneColor={chroma("teal").luminance(0.3).hex()}/>
                    </div>
                    <div className="mrt-toolbox-tool-icon" onClick={() => this.setState({...this.state, disableTextClusterSpan: !this.state.disableTextClusterSpan})}>
                        <Icon type="column-width" theme="outlined" style={{color: chroma("purple").luminance(0.3).hex()}}/>
                    </div>
                </div>
                <MRTViewer id="mrt-viewer" data={this.props.data} userEdits={this.userEdits} 
                    hideSubBranch={this.state.hideSubBranch} disableTextClusterSpan={this.state.disableTextClusterSpan}/>
            </div>
        )
    }
}
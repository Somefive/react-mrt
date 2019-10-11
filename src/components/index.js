import React from 'react'
import MRTViewer from './mrt-viewer'
import { Icon } from 'antd'
import chroma from 'chroma-js'
import './index.css'
import svgLib from 'save-svg-as-png'
import QRCode from 'qrcode'

export default class MRT extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            userEdits: this.props.userEdits || {},
            like: this.props.like || false,
            viewerScale: 100,
            hideSubBranch: false,
            disableTextClusterSpan: false,
            fontExtraSize: 0,
            displayQRCode: false,
        }
        this.generated = false
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

    zoom(larger) {
        this.setState({...this.state, viewerScale: Math.min(Math.max(this.state.viewerScale + (larger ? 10 : -10), 100), 1000)})
    }

    scaleFont(larger) {
        this.setState({...this.state, fontExtraSize: Math.max(0, Math.min(10, this.state.fontExtraSize + (larger ? 2 : -2)))})
    }

    displayQRCode(display) {
        if (!this.generated) {
            QRCode.toCanvas(document.getElementById("mrt-share-qrcode-canvas"), window.location.href, (e) => { if (e) console.error(e) })
            this.generated = true
        }
        this.setState({...this.state, displayQRCode: display})
    }

    render() {
        return (
            <div className="mrt-container" style={{width: `${this.state.viewerScale}%`}}>
                <div className="mrt-toolbox mrt-toolbox-menu horizontal">
                    <div className="menu-item horizontal-secondary mrt-toolbox-tool-icon" onClick={() => this.like()}>
                        <Icon type="heart" theme={this.state.like ? "filled" : "twoTone"}
                            twoToneColor={chroma("red").luminance(0.4).hex()}
                            style={{color: chroma("red").luminance(0.4).hex()}}/>
                    </div>
                    <div className="menu-item horizontal-secondary mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="share-alt" theme="outlined" style={{color: chroma("green").luminance(0.4).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" 
                            onMouseOver={() => this.displayQRCode(true)}
                            onMouseLeave={() => this.displayQRCode(false)}>
                            <Icon type="qrcode" theme="outlined" style={{color: chroma("green").luminance(0.2).hex()}}/>
                        </div>
                    </div>
                    <div className="menu-item horizontal-secondary mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="font-size" theme="outlined" style={{color: chroma("pink").luminance(0.4).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.scaleFont(true)}>
                            <Icon type="zoom-in" theme="outlined" style={{color: chroma("pink").luminance(0.2).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.scaleFont(false)}>
                            <Icon type="zoom-out" theme="outlined" style={{color: chroma("pink").luminance(0.2).hex()}}/>
                        </div>
                    </div>
                    <div className="menu-item horizontal-secondary mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="search" theme="outlined" style={{color: chroma("aquamarine").luminance(0.4).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.zoom(true)}>
                            <Icon type="zoom-in" theme="outlined" style={{color: chroma("aquamarine").luminance(0.2).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.zoom(false)}>
                            <Icon type="zoom-out" theme="outlined" style={{color: chroma("aquamarine").luminance(0.2).hex()}}/>
                        </div>
                    </div>
                    <div className="menu-item horizontal-secondary mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="download" theme="outlined" style={{color: chroma("blue").luminance(0.4).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.capture(true)}>
                            <Icon type="file-image" theme="twoTone" twoToneColor={chroma("blue").luminance(0.2).hex()}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.capture(false)}>
                            <Icon type="camera" theme="twoTone" twoToneColor={chroma("blue").luminance(0.2).hex()}/>
                        </div>
                    </div>
                    <div className="menu-item horizontal-secondary mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="control" theme="outlined" style={{color: chroma("teal").luminance(0.4).hex()}}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.setState({...this.state, hideSubBranch: !this.state.hideSubBranch})}>
                            <Icon type={`eye${this.state.hideSubBranch ? "" : "-invisible"}`} theme="twoTone" twoToneColor={chroma("teal").luminance(0.2).hex()}/>
                        </div>
                        <div className="menu-item vertical-secondary mrt-toolbox-tool-icon" onClick={() => this.setState({...this.state, disableTextClusterSpan: !this.state.disableTextClusterSpan})}>
                            <Icon type="column-width" theme="outlined" style={{color: chroma("teal").luminance(0.2).hex()}}/>
                        </div>
                    </div>
                    <div className="menu-item mrt-toolbox-menu vertical">
                        <div className="menu-item mrt-toolbox-tool-icon">
                            <Icon type="appstore" theme="outlined" style={{color: chroma("purple").luminance(0.4).hex()}}/>
                        </div>
                    </div>
                </div>
                <div className="mrt-qrcode" style={{display: this.state.displayQRCode ? "block" : "none"}}>
                    <canvas id="mrt-share-qrcode-canvas"/>
                </div>
                <MRTViewer id="mrt-viewer" data={this.props.data} userEdits={this.userEdits} 
                    hideSubBranch={this.state.hideSubBranch} disableTextClusterSpan={this.state.disableTextClusterSpan}
                    fontExtraSize={this.state.fontExtraSize}
                    authors={this.props.authors}/>
            </div>
        )
    }
}
import React from 'react'
import MRTViewer from './mrt-viewer'
import './index.css'
import svgLib from 'save-svg-as-png'
import { Toolbox } from './toolbox/index'

export default class MRT extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            like: this.props.like || false,
            viewerScale: 100,
            hideSubBranch: false,
            disableTextClusterSpan: false,
            fontExtraSize: 0,
        }
        this.generated = false
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

    onLoadJson(e) {
        if (e.target.files.length === 0) return
        const reader = new FileReader()
        reader.onload = (e) => {
            if (this.props.onLoadJson) this.props.onLoadJson(JSON.parse(e.target.result))
        }
        reader.readAsText(e.target.files[0])
    }

    render() {
        return (
            <div className="mrt-container" style={{width: `${this.state.viewerScale}%`}}>
                <Toolbox lang={this.props.lang}
                    onLike={() => this.props.onLike()} like={this.props.like}
                    onHideSubBranch={() => this.setState({hideSubBranch: !this.state.hideSubBranch})} hideSubBranch={this.state.hideSubBranch}
                    onDisableTextClusterSpan={() => this.setState({disableTextClusterSpan: !this.state.disableTextClusterSpan})} disableTextClusterSpan={this.state.disableTextClusterSpan}
                    onLoadJson={this.props.onLoadJson ? (e) => this.onLoadJson(e) : undefined}
                    scaleFont={(larger) => this.scaleFont(larger)}
                    zoom={(larger) => this.zoom(larger)}
                    capture={(full) => this.capture(full)}
                />
                <MRTViewer id="mrt-viewer" data={this.props.data} userEdits={this.props.userEdits} 
                    hideSubBranch={this.state.hideSubBranch} disableTextClusterSpan={this.state.disableTextClusterSpan}
                    fontExtraSize={this.state.fontExtraSize}
                    authors={this.props.authors}
                    onEditChange={this.props.onEditChange}/>
            </div>
        )
    }
}
import React from 'react'
import QRCode from 'qrcode'
import './toolbox.css'
import Tool from './tool'
import TooltipTextTranslation from './tooltip-text-translation.json'

export class Toolbox extends React.Component {

    onLike() {
        if (this.props.onLike) this.props.onLike()
    }

    onHideSubBranch() {
        if (this.props.onHideSubBranch) this.props.onHideSubBranch()
    }

    onDisableTextClusterSpan() {
        if (this.props.onDisableTextClusterSpan) this.props.onDisableTextClusterSpan()
    }

    onLoadJson(e) {
        if (this.props.onLoadJson) this.props.onLoadJson(e)
    }

    scaleFont(larger) {
        if (this.props.scaleFont) this.props.scaleFont(larger)
    }

    zoom(larger) {
        if (this.props.zoom) this.props.zoom(larger)
    }
    
    capture(full) {
        if (this.props.capture) this.props.capture(full)
    }

    render() {
        setTimeout(() => {
            QRCode.toCanvas(document.getElementById("mrt-share-qrcode-canvas"), window.location.href, (e) => { if (e) console.error(e) })
        }, 500)
        const lang = this.props.lang || "en"
        const translation = TooltipTextTranslation[lang]
        const t = (text) => (translation && translation[text.toLowerCase()]) ? translation[text.toLowerCase()] : text
        return (
            <div>
                <div className="toolgroup horizontal">
                    <div className="toolgroup secondary vertical">
                        <Tool type="heart" theme={this.props.like ? "filled" : "twoTone"} color="red" tooltipText={t(this.props.like ? "Dislike" : "Like")} primary onClick={() => this.onLike()}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="share-alt" theme="outlined" color="green" tooltipText={t("Share")} primary/>
                        <Tool className="qrcode-icon" type="qrcode" theme="outlined" color="green" tooltipText={t("QR Code")}>
                            <canvas className="qrcode" id="mrt-share-qrcode-canvas"/>
                        </Tool>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="font-size" theme="outlined" color="pink" tooltipText={t("Font Size")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="pink" tooltipText={t("Larger Font")} onClick={() => this.scaleFont(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="pink" tooltipText={t("Smaller Font")} onClick={() => this.scaleFont(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="search" theme="outlined" color="aquamarine" tooltipText={t("Zoom")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="aquamarine" tooltipText={t("Zoom In")} onClick={() => this.zoom(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="aquamarine" tooltipText={t("Zoom Out")} onClick={() => this.zoom(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="download" theme="outlined" color="blue" tooltipText={t("Download")} primary/>
                        <Tool type="file-image" theme="twoTone" color="blue" tooltipText={t("Full Picture")} onClick={() => this.capture(true)}/>
                        <Tool type="camera" theme="twoTone" color="blue" tooltipText={t("Snapshot")} onClick={() => this.capture(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="control" theme="outlined" color="teal" tooltipText={t("Control")} primary/>
                        <Tool type={`eye${this.props.hideSubBranch ? "" : "-invisible"}`} theme="twoTone" color="teal" onClick={() => this.onHideSubBranch()}
                            tooltipText={t(this.props.hideSubBranch ? "Display Sub Branch" : "Hide Sub Branch")}/>
                        <Tool type="column-width" theme="outlined" color="teal" onClick={() => this.onDisableTextClusterSpan()}
                            tooltipText={t(this.props.disableTextClusterSpan ? "Enable Text Span" : "Disable Text Span")}/>
                        {this.props.onLoadJson && 
                        <Tool type="folder-open" theme="outlined" color="teal" onClick={() => document.getElementById("mrt-file-load-input").click()}
                            tooltipText={t("Load JSON")}/>}
                        <input id="mrt-file-load-input" type="file" hidden onChange={(e) => this.onLoadJson(e)}/>
                    </div>
                    <div className="toolgroup vertical">
                        <Tool className="toolgroup" type="appstore" theme="outlined" color="purple" tooltipText={t("Toolbox")} primary/>
                    </div>
                </div>
            </div>
        )
    }

}

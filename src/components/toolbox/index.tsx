import React from 'react'
import QRCode from 'qrcode'
import './index.css'
import Tool from './tool'
import TooltipTextTranslation from './tooltip-text-translation.json'
import Helper from './helper'
import { Modal } from 'antd'

interface IProps {
    lang?: "zh" | "en";
    likeable?: boolean;
    like?: boolean;
    shareable?: boolean;
    hideSubBranch: boolean;
    disableTextClusterSpan: boolean;
    scaleFont: (b: boolean) => void;
    zoom: (b: boolean) => void;
    capture?: () => void;
    onLike?: () => void;
    onHideSubBranch: () => void;
    onDisableTextClusterSpan: () => void;
}

interface IState {
    helperVisible: boolean;
}

export class Toolbox extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props)
        this.state = { 
            helperVisible: false 
        }
    }

    public render() {
        const renderQRCode = () => {
            const canvas = document.getElementById("mrt-share-qrcode-canvas")
            if (canvas)
                QRCode.toCanvas(canvas, window.location.href, (e: any) => { if (e) console.error(e) })
            else
                setTimeout(renderQRCode, 500)
        }
        renderQRCode()
        const { shareable, likeable, like, onLike } = this.props;
        const lang = this.props.lang || "en";
        const translation: {[index: string]: any} = TooltipTextTranslation['zh'] as any as {[index: string]: any};
        const t = (text: string) => (translation && translation[text.toLowerCase()]) ? translation[text.toLowerCase()] : text
        return (
            <div>
                <div className="toolgroup horizontal">
                    {
                        !!likeable && (
                            <div className="toolgroup secondary vertical">
                                <Tool type="heart" theme={like ? "filled" : "twoTone"} color="red" tooltipText={t(like ? "Dislike" : "Like")} primary onClick={() => onLike && onLike()}/>
                            </div>
                        )
                    }
                    <div className="toolgroup secondary vertical">
                        <Tool className="toolgroup" type="question-circle" theme="outlined" color="yellow" tooltipText={t("Guide")} primary onClick={() => this.setState({helperVisible: true})}/>
                    </div>
                    {
                        !!shareable && (
                            <div className="toolgroup secondary vertical">
                                <Tool type="share-alt" theme="outlined" color="green" tooltipText={t("Share")} primary/>
                                <Tool className="qrcode-icon" type="qrcode" theme="outlined" color="green" tooltipText={t("QR Code")}>
                                    <canvas className="qrcode" id="mrt-share-qrcode-canvas"/>
                                </Tool>
                            </div>
                        )
                    }
                    <div className="toolgroup secondary vertical">
                        <Tool type="font-size" theme="outlined" color="pink" tooltipText={t("Font Size")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="pink" tooltipText={t("Larger Font")} onClick={() => this.props.scaleFont(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="pink" tooltipText={t("Smaller Font")} onClick={() => this.props.scaleFont(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="search" theme="outlined" color="aquamarine" tooltipText={t("Zoom")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="aquamarine" tooltipText={t("Zoom In")} onClick={() => this.props.zoom(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="aquamarine" tooltipText={t("Zoom Out")} onClick={() => this.props.zoom(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="download" theme="outlined" color="blue" tooltipText={t("Download")} primary/>
                        <Tool type="file-image" theme="twoTone" color="blue" tooltipText={t("Full Picture")} onClick={() => this.props.capture && this.props.capture()}/>
                        {/* <Tool type="camera" theme="twoTone" color="blue" tooltipText={t("Snapshot")} onClick={() => this.props.capture && this.props.capture()}/> */}
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="control" theme="outlined" color="teal" tooltipText={t("Control")} primary/>
                        <Tool type={`eye${this.props.hideSubBranch ? "" : "-invisible"}`} theme="twoTone" color="teal" onClick={() => this.props.onHideSubBranch()}
                            tooltipText={t(this.props.hideSubBranch ? "Display Sub Branch" : "Hide Sub Branch")}/>
                        <Tool type="column-width" theme="outlined" color="teal" onClick={() => this.props.onDisableTextClusterSpan()}
                            tooltipText={t(this.props.disableTextClusterSpan ? "Enable Text Span" : "Disable Text Span")}/>
                    </div>
                    <div className="toolgroup vertical">
                        <Tool className="toolgroup" type="appstore" theme="outlined" color="purple" tooltipText={t("Toolbox")} primary/>
                    </div>
                </div>
                <HelperModal lang={lang} onCancel={() => this.setState({helperVisible: false})} visible={this.state.helperVisible}/>
            </div>
        )
    }
}

interface IHelperModalProps {
    lang: "zh" | "en";
    visible: boolean;
    onCancel: () => void;
}

export class HelperModal extends React.Component<IHelperModalProps> {
    render() {
        const translation: {[index: string]: any} = TooltipTextTranslation['zh'] as any as {[index: string]: any};
        const t = (text: string) => (translation && translation[text.toLowerCase()]) ? translation[text.toLowerCase()] : text
        return (
            <Modal className="mrt-modal" title={t("Guide")} visible={this.props.visible} onCancel={this.props.onCancel} footer={null} width={"auto"} bodyStyle={{padding: "1rem"}}>
                <Helper lang={this.props.lang}/>
            </Modal>
        )
    }
}

import React, { ChangeEvent } from 'react'
import QRCode from 'qrcode'
import './index.css'
import Tool from './tool'
import TooltipTextTranslation from './tooltip-text-translation.json'
import Helper from './helper'
import { Modal } from 'antd'
import { ILang, Translator } from '../../utils/translation'

interface IProps {
    lang: ILang;
    likeable?: boolean;
    like?: boolean;
    shareable?: boolean;
    downloadable?: boolean;
    loadable?: boolean;
    recommendable?: boolean;
    hideSubBranch: boolean;
    disableTextClusterSpan: boolean;
    scaleFont: (b: boolean) => void;
    zoom: (b: boolean) => void;
    capture?: () => void;
    onLike?: () => void;
    onHideSubBranch: () => void;
    onDisableTextClusterSpan: () => void;
    onLoadJson?: (json: any) => void;
    onRecommendableChange: () => void;
}

interface IState {
    helperVisible: boolean;
}

export class Toolbox extends React.Component<IProps, IState> {

    private _fileLoadInput: HTMLInputElement | undefined
    private translator: Translator = new Translator(TooltipTextTranslation)

    constructor(props: IProps) {
        super(props)
        this.state = {
            helperVisible: false
        }
        this._fileLoadInput = undefined
    }

    loadJson(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        const reader = new FileReader()
        reader.onload = (e) => {
            if (this.props.onLoadJson && e.target) this.props.onLoadJson(JSON.parse(e.target.result as string))
            if (this._fileLoadInput) this._fileLoadInput.value = ''
        }
        reader.readAsText(e.target.files[0])
    }

    public t(key: string): string {
        return this.translator.T(key, this.props.lang)
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
        const { shareable, likeable, like, onLike, downloadable, loadable } = this.props;
        return (
            <div>
                <div className="toolgroup horizontal">
                    {
                        !!likeable && (
                            <div className="toolgroup secondary vertical">
                                <Tool type="heart" theme={like ? "filled" : "twoTone"} color="red" tooltipText={this.t(like ? "Dislike" : "Like")} primary onClick={() => onLike && onLike()}/>
                            </div>
                        )
                    }
                    <div className="toolgroup secondary vertical">
                        <Tool className="toolgroup" type="question-circle" theme="outlined" color="yellow" tooltipText={this.t("Guide")} primary onClick={() => this.setState({helperVisible: true})}/>
                    </div>
                    {
                        !!shareable && (
                            <div className="toolgroup secondary vertical">
                                <Tool type="share-alt" theme="outlined" color="green" tooltipText={this.t("Share")} primary/>
                                <Tool className="qrcode-icon" type="qrcode" theme="outlined" color="green" tooltipText={this.t("QR Code")}>
                                    <canvas className="qrcode" id="mrt-share-qrcode-canvas"/>
                                </Tool>
                            </div>
                        )
                    }
                    <div className="toolgroup secondary vertical">
                        <Tool type="font-size" theme="outlined" color="pink" tooltipText={this.t("Font Size")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="pink" tooltipText={this.t("Larger Font")} onClick={() => this.props.scaleFont(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="pink" tooltipText={this.t("Smaller Font")} onClick={() => this.props.scaleFont(false)}/>
                    </div>
                    <div className="toolgroup secondary vertical">
                        <Tool type="search" theme="outlined" color="aquamarine" tooltipText={this.t("Zoom")} primary/>
                        <Tool type="zoom-in" theme="outlined" color="aquamarine" tooltipText={this.t("Zoom In")} onClick={() => this.props.zoom(true)}/>
                        <Tool type="zoom-out" theme="outlined" color="aquamarine" tooltipText={this.t("Zoom Out")} onClick={() => this.props.zoom(false)}/>
                    </div>
                    {
                        !!downloadable && (
                            <div className="toolgroup secondary vertical">
                                <Tool type="download" theme="outlined" color="blue" tooltipText={this.t("Download")} primary/>
                                <Tool type="file-image" theme="twoTone" color="blue" tooltipText={this.t("Full Picture")} onClick={() => this.props.capture && this.props.capture()}/>
                                {/* <Tool type="camera" theme="twoTone" color="blue" tooltipText={this.t("Snapshot")} onClick={() => this.props.capture && this.props.capture()}/> */}
                            </div>
                        )
                    }

                    <div className="toolgroup secondary vertical">
                        <Tool type="control" theme="outlined" color="teal" tooltipText={this.t("Control")} primary/>
                        <Tool type={`eye${this.props.hideSubBranch ? "" : "-invisible"}`} theme="twoTone" color="teal" onClick={() => this.props.onHideSubBranch()}
                            tooltipText={this.t(this.props.hideSubBranch ? "Display Sub Branch" : "Hide Sub Branch")}/>
                        <Tool type="column-width" theme="outlined" color="teal" onClick={() => this.props.onDisableTextClusterSpan()}
                            tooltipText={this.t(this.props.disableTextClusterSpan ? "Enable Text Span" : "Disable Text Span")}/>
                        { !!loadable && <Tool type="folder-open" theme="outlined" color="teal" onClick={() => {
                            if (this._fileLoadInput) this._fileLoadInput.click()
                        }} tooltipText={this.t("Load JSON")}/>}
                        { !!loadable && <input ref={d => this._fileLoadInput = d!} id="mrt-file-load-input" type="file" hidden onChange={(e) => this.loadJson(e)}/>}
                        { this.props.recommendable !== undefined && <Tool type="highlight" theme="outlined" color="teal" onClick={() => this.props.onRecommendableChange()}
                            tooltipText={this.t(!!this.props.recommendable ? "Enable Recommendation" : "Disable Recommendation")}/>}
                    </div>
                    <div className="toolgroup vertical">
                        <Tool className="toolgroup" type="appstore" theme="outlined" color="purple" tooltipText={this.t("Toolbox")} primary/>
                    </div>
                </div>
                <HelperModal lang={this.props.lang} onCancel={() => this.setState({helperVisible: false})} visible={this.state.helperVisible}/>
            </div>
        )
    }
}

interface IHelperModalProps {
    lang?: ILang;
    visible: boolean;
    onCancel: () => void;
}

export class HelperModal extends React.Component<IHelperModalProps> {
    private translator: Translator = new Translator(TooltipTextTranslation)
    render() {
        return (
            <Modal className="mrt-modal" title={this.translator.T("Guide", this.props.lang)} visible={this.props.visible} onCancel={this.props.onCancel} footer={null} width={"auto"} bodyStyle={{padding: "1rem"}}>
                <Helper lang={this.props.lang}/>
            </Modal>
        )
    }
}

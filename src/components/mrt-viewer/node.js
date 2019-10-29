import React from 'react'
import { ReactComponent as IconThumbsUp } from '@ant-design/icons-svg/inline-svg/outline/like.svg'
import { ReactComponent as IconThumbsDown } from '@ant-design/icons-svg/inline-svg/outline/dislike.svg'
import { ReactComponent as IconThumbsUpSolid } from '@ant-design/icons-svg/inline-svg/fill/like.svg'
import { ReactComponent as IconThumbsDownSolid } from '@ant-design/icons-svg/inline-svg/fill/dislike.svg'
import { ReactComponent as IconExchange } from '@ant-design/icons-svg/inline-svg/outline/pull-request.svg'
import { ReactComponent as IconCaretDown } from '@ant-design/icons-svg/inline-svg/outline/arrows-alt.svg'
import { ReactComponent as IconCaretUp } from '@ant-design/icons-svg/inline-svg/outline/shrink.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'

const ThumbUpColor = chroma("green").luminance(0.3).desaturate(1)
const ThumbDownColor = chroma("red").luminance(0.3).desaturate(2)
const ExchangeColor = chroma("blue").luminance(0.3).desaturate(1)
const CaretColor = chroma("grey").luminance(0.3)
const AbstractColor = chroma("grey").luminance(0.1)

export class NodeText extends React.Component {

    constructor(props) {
        super(props)
        this.state = {displayInteractionTool: false}
        this.id = randomstring.generate(8)
        this.state = { expand: -1 }
    }

    onEdit(action, source) {
        if (this.props.onEdit) this.props.onEdit(action, source)
    }

    onHover(hover) {
        if (!hover && this.state.expand !== -1) this.setState({expand: -1})
    }

    render() {
        let textColor = chroma(this.props.color).darken()
        let baseY = 0
        let textLines = 0
        const iconSize = this.props.lineHeight * 1.25
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            const isFocus = this.state.expand === _idx
            const collapseHandler = () => this.setState({expand: isFocus ? -1 : _idx})
            const textPieces = isFocus ? pin.fullTextPieces : pin.textPieces
            const abstractHeight = pin.abstractPieces.length * this.props.secondaryLineHeight
            const iconY = (textPieces.length - 1) * this.props.lineHeight + this.props.editButtonMarginTop + isFocus * abstractHeight
            const textWidth = isFocus ? this.props.fullTextWidth : this.props.textWidth
            const generateEditIcon = (T, dx, fill, action) => <g transform={`translate(${textWidth-iconSize*dx}, ${iconY})`}>
                <g className="paper-edit-icon" style={{transformOrigin: `${iconSize/2}px ${iconSize/2}px`}}
                    onClick={action === "collapse" ? collapseHandler : (() => this.onEdit(action, pin))}>
                    <T className="paper-edit-icon" fill={fill} width={iconSize} height={iconSize}/>
                    <rect className="paper-edit-icon" width={iconSize} height={iconSize} fill="transparent"/>
                </g>
            </g>
            const isUp = pin.edits && pin.edits.rate > 0
            const isDown = pin.edits && pin.edits.rate < 0
            const transformOriginX = (this.props.scaleOrigin === "left") ? 0 : (this.props.scaleOrigin === "middle" ? (textWidth / 2) : textWidth)
            return (
                <g className="paper-view-group-outer"
                    key={_idx}
                    onMouseOver={() => this.onHover(true)}
                    onMouseLeave={() => this.onHover(false)}
                    transform={`translate(${this.props.textLeadingMargin + this.props.radius}, ${baseY})`}>
                    <g className="paper-view-group-inner" style={{transformOrigin: `${transformOriginX}px ${-this.props.lineHeight}px`}}>
                        <rect className="paper-text-background" x={-this.props.lineHeight} y={-this.props.lineHeight * 2.5}
                            width={textWidth+2*this.props.lineHeight} height={this.props.lineHeight * 4 + iconY + iconSize}
                            fill="white" filter="url(#blur-filter)"/>
                        <text className="paper-text" fontSize={this.props.fontSize} fill={textColor} onClick={collapseHandler}>
                            {textPieces.map((_text, idx) => {
                                textLines++
                                return <tspan key={idx} x="0" y={idx * this.props.lineHeight}>{_text}</tspan>
                            })}
                        </text>
                        {isFocus && 
                            <text className="paper-abstract-inner" fontSize={this.props.secondaryFontSize} fill={AbstractColor}>
                                {pin.abstractPieces.map((_text, idx) => <tspan key={idx} x="0" y={textPieces.length * this.props.lineHeight + idx * this.props.secondaryLineHeight}>{_text}</tspan>)}
                            </text>}
                        <g className="paper-edit-icon-group">
                            {this.props.editable && generateEditIcon(IconExchange, 6, ExchangeColor, "to-exchange")}
                            {generateEditIcon(isUp ? IconThumbsUpSolid : IconThumbsUp, 4.5, ThumbUpColor, isUp ? "thumb-delete" : "thumb-up")}
                            {generateEditIcon(isDown ? IconThumbsDownSolid : IconThumbsDown, 3, ThumbDownColor, isDown ? "thumb-delete" : "thumb-down")}
                            {pin.abstractPieces.length > 0 && generateEditIcon(isFocus ? IconCaretUp : IconCaretDown, 1.5, CaretColor, "collapse")}
                        </g>
                    </g>
                </g>
            )
        })
        return (
            <g className="era-node-text-group" transform={`translate(${this.props.x}, ${this.props.y})`}>
                {texts.reverse()}
            </g>
        )
    }
}
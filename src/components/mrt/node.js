import React from 'react'
import { ReactComponent as IconThumbsUpSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDownSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'
import { ReactComponent as IconExchange } from '@fortawesome/fontawesome-free/svgs/solid/exchange-alt.svg'
import { ReactComponent as IconCaretDown } from '@fortawesome/fontawesome-free/svgs/solid/caret-down.svg'
import { ReactComponent as IconCaretUp } from '@fortawesome/fontawesome-free/svgs/solid/caret-up.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'

const ThumbUpSolidColor = chroma("green").brighten(1)
const ThumbUpColor = ThumbUpSolidColor.darken(2)
const ThumbDownSolidColor = chroma("red").brighten(1)
const ThumbDownColor = ThumbDownSolidColor.darken(2)
const ExchangeColor = chroma("blue").brighten(0)
const CaretColor = chroma("grey").brighten(0)

export class NodeCircle extends React.Component {
    
    render() {
        const bottomY = Math.max((this.props.node.lines - 2) * this.props.lineHeight, this.props.radius)
        const collapsed_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},0 L ${-this.props.radius},0`
        const expanded_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},${bottomY} A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},${bottomY} L ${-this.props.radius},0`
        const path = this.props.expand ? expanded_path : collapsed_path
        return (
            <path className="era-node-circle" d={path}
                transform={`translate(${this.props.node.x}, ${this.props.node.y})`}
                onMouseOver={() => { if (this.props.onHover) this.props.onHover(true) }}
                onMouseLeave={() => { if (this.props.onHover) this.props.onHover(false) }}
                stroke={this.props.color} strokeWidth={this.props.strokeWidth}
                fill={this.props.expand ? this.props.color : "white"} />
        )
    }

}

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
        if (this.props.onHover) this.props.onHover(hover)
    }

    render() {
        let textColor = chroma(this.props.color).darken()
        let baseY = 0
        let textLines = 0
        const iconSize = this.props.lineHeight * 2
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            const isFocus = this.state.expand === _idx
            const collapseHandler = () => this.setState({expand: isFocus ? -1 : _idx})
            const textPieces = isFocus ? pin.fullTextPieces : pin.textPieces
            const abstractHeight = pin.abstractPieces.length * this.props.secondaryLineHeight
            const iconY = (textPieces.length - 1) * this.props.lineHeight + this.props.editButtonMarginTop + isFocus * abstractHeight
            const textWidth = isFocus ? this.props.fullTextWidth : this.props.textWidth
            const generateEditIcon = (T, dx, fill, action) => <g>
                <T className="paper-edit-icon" x={textWidth-iconSize*dx} y={iconY} fill={fill} width={iconSize} height={iconSize}/>
                <rect className="paper-edit-icon" x={textWidth-iconSize*dx} y={iconY} width={iconSize} height={iconSize} 
                    onClick={action === "collapse" ? collapseHandler : (() => this.onEdit(action, pin))} fill="transparent" />
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
                            <text className="paper-abstract-inner" fontSize={this.props.secondaryFontSize} fill={textColor}>
                                {pin.abstractPieces.map((_text, idx) => <tspan key={idx} x="0" y={textPieces.length * this.props.lineHeight + idx * this.props.secondaryLineHeight}>{_text}</tspan>)}
                            </text>}
                        <g className="paper-edit-icon-group">
                            {this.props.editable && generateEditIcon(IconExchange, 6, ExchangeColor, "to-exchange")}
                            {generateEditIcon(IconThumbsUpSolid, 4.5, isUp ? ThumbUpSolidColor : ThumbUpColor, isUp ? "thumb-delete" : "thumb-up")}
                            {generateEditIcon(IconThumbsDownSolid, 3, isDown ? ThumbDownSolidColor : ThumbDownColor, isDown ? "thumb-delete" : "thumb-down")}
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
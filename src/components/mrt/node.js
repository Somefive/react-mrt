import React from 'react'
import { ReactComponent as IconThumbsUpSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDownSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'
import { ReactComponent as IconExchange } from '@fortawesome/fontawesome-free/svgs/solid/exchange-alt.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'

const ThumbUpSolidColor = chroma("green").brighten(2)
const ThumbUpColor = ThumbUpSolidColor.darken(4)
const ThumbDownSolidColor = chroma("red").brighten(2)
const ThumbDownColor = ThumbDownSolidColor.darken(4)
const ExchangeColor = chroma("blue").brighten(0)

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

export default class Node extends React.Component {

    constructor(props) {
        super(props)
        this.state = {displayInteractionTool: false}
        this.id = randomstring.generate(8)
        this.state = { focusIndex: -1 }
    }

    onEdit(action, source) {
        if (this.props.onEdit) this.props.onEdit(action, source)
    }

    render() {
        let textColor = chroma(this.props.color).darken()
        let baseY = 0
        let textLines = 0
        const iconSize = this.props.lineHeight * 2
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            const generateEditIcon = (T, x, y, fill, action) => <g>
                <T className="paper-edit-icon" x={x} y={y} fill={fill} width={iconSize} height={iconSize}/>
                <rect x={x} y={y} width={iconSize} height={iconSize} onClick={() => this.onEdit(action, pin)} fill="transparent" />
            </g>
            const isUp = pin.edits && pin.edits.rate > 0
            const isDown = pin.edits && pin.edits.rate < 0
            return (
                <g className="paper-view-group-outer"
                    key={_idx}
                    onMouseOver={() => { if (this.props.onHover) this.props.onHover(true) }}
                    onMouseLeave={() => { if (this.props.onHover) this.props.onHover(false) }}
                    transform={`translate(${this.props.textLeadingMargin + this.props.radius}, ${baseY})`}>
                    <g className="paper-view-group-inner">
                        <text className="paper-text" fontSize={this.props.fontSize} fill={textColor}>
                            {pin.textPieces.map((_text, idx) => {
                                textLines++
                                return <tspan key={idx} x="0" y={idx * this.props.lineHeight}>{_text}</tspan>
                            })}
                        </text>
                        {this.props.editable &&
                        <g className="paper-edit-icon-group">
                            <rect x="0" y={-this.props.lineHeight-iconSize} width={iconSize * 5.5} height={iconSize} opacity="0"/>
                            {generateEditIcon(IconThumbsUpSolid, iconSize * 0.5, -this.props.lineHeight-iconSize, isUp ? ThumbUpSolidColor : ThumbUpColor, isUp ? "thumb-delete" : "thumb-up")}
                            {generateEditIcon(IconThumbsDownSolid, iconSize * 2, -this.props.lineHeight-iconSize, isDown ? ThumbDownSolidColor : ThumbDownColor, isDown ? "thumb-delete" : "thumb-down")}
                            {generateEditIcon(IconExchange, iconSize * 3.5, -this.props.lineHeight-iconSize, ExchangeColor, "to-exchange")}
                        </g>
                        }
                    </g>
                </g>
            )
        })
        return (
            <g className="era-node-text-group" transform={`translate(${this.props.x}, ${this.props.y})`}>
                {texts}
            </g>
        )
    }
}
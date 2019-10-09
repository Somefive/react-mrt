import React from 'react'
import { ReactComponent as IconThumbsUpSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDownSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'
import { ReactComponent as IconThumbsUp } from '@fortawesome/fontawesome-free/svgs/regular/thumbs-up.svg'
import { ReactComponent as IconThumbsDown } from '@fortawesome/fontawesome-free/svgs/regular/thumbs-down.svg'
import { ReactComponent as IconExchange } from '@fortawesome/fontawesome-free/svgs/solid/exchange-alt.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'
import { tsThisType } from '@babel/types'

export default class Node extends React.Component {

    constructor(props) {
        super(props)
        this.state = {displayInteractionTool: false}
        this.id = randomstring.generate(8)
        this.state = { focusIndex: -1, focusing: false }
    }

    onEdit(action, source) {
        if (this.props.onEdit) this.props.onEdit(action, source)
    }

    render() {
        let textColor = chroma(this.props.color).darken()
        let baseY = 0
        let textXOffset = this.props.radius * 1.5
        let textLines = 0
        const iconSize = this.props.lineHeight * 2
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            return (
                <g className="paper-view-group" key={_idx} transform={`translate(${textXOffset}, ${baseY}) scale(${this.state.focusIndex === -1 ? 1 : (this.state.focusIndex === _idx ? 2 : 0.5)})`}
                    onMouseOver={(e) => { if (!this.props.isRoot) this.setState({...this.state, focusIndex: _idx})}}
                    onMouseLeave={(e) => { if (!this.props.isRoot) this.setState({...this.state, focusIndex: -1})}}>
                    <text className="paper-text" id={`text-${this.id}-${_idx}`} fontSize={this.props.fontSize} fill={textColor}
                          opacity={(this.state.focusIndex === -1 ? 1 : (this.state.focusIndex === _idx ? 0.75 : 0.25))}>
                        {pin.textPieces.map((_text, idx) => {
                            textLines++
                            return <tspan key={idx} x="0" y={idx * this.props.lineHeight}>{_text}</tspan>
                        })}
                    </text>
                    <g className="paper-edit-icon-group" visibility={this.state.focusIndex === _idx ? "none" : "hidden"} opacity={this.state.focusIndex === _idx ? 1 : 0}
                        transform={`translate(0, ${-this.props.lineHeight-iconSize})`}>
                        <rect x="0" y="0" width={iconSize * 5.5} height={iconSize} opacity="0"/>
                        <g className="paper-edit-icon" opacity={pin.edits.rate > 0 ? 1 : 0} visibility={pin.edits.rate > 0 ? "none" : "hidden"}>
                            <IconThumbsUpSolid x={iconSize * 0.5} y="0" fill="#00a000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 0.5} y="0" width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-delete", pin.source)} fill="transparent" />
                        </g>                        
                        <g className="paper-edit-icon" opacity={pin.edits.rate < 0 ? 1 : 0} visibility={pin.edits.rate < 0 ? "none" : "hidden"}>
                            <IconThumbsDownSolid x={iconSize * 2} y="0" fill="#a00000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 2} y="0" width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-delete", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon" opacity={pin.edits.rate >= 0 ? 1 : 0} visibility={pin.edits.rate >= 0 ? "none" : "hidden"}>
                            <IconThumbsDown x={iconSize * 2} y="0" fill="#a00000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 2} y="0" width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-down", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon" opacity={pin.edits.rate <= 0 ? 1 : 0} visibility={pin.edits.rate <= 0 ? "none" : "hidden"}>
                            <IconThumbsUp x={iconSize * 0.5} y="0" fill="#00a000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 0.5} y="0" width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-up", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon">
                            <IconExchange x={iconSize * 3.5} y="0" fill="#0000a0" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 3.5} y="0" width={iconSize} height={iconSize} onClick={() => this.onEdit("to-exchange", pin.source)} fill="transparent" />
                        </g>
                    </g>
                </g>
            )
        })
        const bottomY = baseY
        const collapsed_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},0 L ${-this.props.radius},0`
        const expanded_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},${bottomY} A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},${bottomY} L ${-this.props.radius},0`
        const isExpand = this.state.focusing || this.state.focusIndex !== -1
        const path = isExpand ? expanded_path : collapsed_path
        return (
            <g transform={`translate(${this.props.x}, ${this.props.y})`}>
                <g onMouseOver={() => this.setState({...this.state, focusing: true})}
                   onMouseLeave={() => this.setState({...this.state, focusing: false})}>
                    <path className="era-node-circle" d={path} stroke={this.props.color} strokeWidth={this.props.strokeWidth} fill={isExpand ? this.props.color : "white"} />
                </g>
                {texts}
            </g>
        )
    }
}
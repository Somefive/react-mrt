import React from 'react'
import { ReactComponent as IconThumbsUpSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDownSolid } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'
import { ReactComponent as IconThumbsUp } from '@fortawesome/fontawesome-free/svgs/regular/thumbs-up.svg'
import { ReactComponent as IconThumbsDown } from '@fortawesome/fontawesome-free/svgs/regular/thumbs-down.svg'
import { ReactComponent as IconExchange } from '@fortawesome/fontawesome-free/svgs/solid/exchange-alt.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'

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
        let textXOffset = this.props.radius * 1.5
        let textLines = 0
        const iconSize = this.props.lineHeight * 2
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            return (
                <g key={_idx} transform={`translate(${textXOffset}, ${baseY})`}
                    onMouseOver={(e) => { if (!this.props.isRoot) this.setState({...this.state, focusIndex: _idx})}}
                    onMouseLeave={(e) => { if (!this.props.isRoot) this.setState({...this.state, focusIndex: -1})}}>
                    <text className="paper-text" id={`text-${this.id}-${_idx}`} fontSize={this.props.fontSize} fill={textColor}
                          opacity={(this.state.focusIndex === _idx ? 0.3 : (this.state.focusIndex === _idx + 1 ? 0.1 : 1))}>
                        {pin.textPieces.map((_text, idx) => {
                            textLines++
                            return <tspan key={idx} x="0" y={idx * this.props.lineHeight}>{_text}</tspan>
                        })}
                    </text>
                    <g className="paper-edit-icon-group" visibility={this.state.focusIndex === _idx ? "none" : "hidden"} opacity={this.state.focusIndex === _idx ? 1 : 0}>
                        <rect x="0" y={-iconSize} width={iconSize * 5.5} height={iconSize} opacity="0"/>
                        <g className="paper-edit-icon" opacity={pin.edits.rate > 0 ? 1 : 0} visibility={pin.edits.rate > 0 ? "none" : "hidden"}>
                            <IconThumbsUpSolid x={iconSize * 0.5} y={-iconSize} fill="#00a000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 0.5} y={-iconSize} width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-delete", pin.source)} fill="transparent" />
                        </g>                        
                        <g className="paper-edit-icon" opacity={pin.edits.rate < 0 ? 1 : 0} visibility={pin.edits.rate < 0 ? "none" : "hidden"}>
                            <IconThumbsDownSolid x={iconSize * 2} y={-iconSize} fill="#a00000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 2} y={-iconSize} width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-delete", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon" opacity={pin.edits.rate >= 0 ? 1 : 0} visibility={pin.edits.rate >= 0 ? "none" : "hidden"}>
                            <IconThumbsDown x={iconSize * 2} y={-iconSize} fill="#a00000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 2} y={-iconSize} width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-down", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon" opacity={pin.edits.rate <= 0 ? 1 : 0} visibility={pin.edits.rate <= 0 ? "none" : "hidden"}>
                            <IconThumbsUp x={iconSize * 0.5} y={-iconSize} fill="#00a000" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 0.5} y={-iconSize} width={iconSize} height={iconSize} onClick={() => this.onEdit("thumb-up", pin.source)} fill="transparent" />
                        </g>
                        <g className="paper-edit-icon">
                            <IconExchange x={iconSize * 3.5} y={-iconSize} fill="#0000a0" width={iconSize} height={iconSize}/>
                            <rect x={iconSize * 3.5} y={-iconSize} width={iconSize} height={iconSize} onClick={() => this.onEdit("to-exchange", pin.source)} fill="transparent" />
                        </g>
                    </g>
                    {/* <path className="cross-identifier" d={`M ${-this.props.radius/3},0 L ${this.props.radius/3},0 M 0,${-this.props.radius/3} L 0,${this.props.radius/3}`}
                          stroke={this.props.color} strokeWidth={this.props.strokeWidth}/> */}
                </g>
            )
        })
        const bottomY = baseY
        const collapsed_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},0 L ${-this.props.radius},0`
        const expanded_path = `M ${-this.props.radius},0 A ${this.props.radius} ${this.props.radius} 0 0 1 ${this.props.radius},0 L ${this.props.radius},${bottomY} A ${this.props.radius} ${this.props.radius} 0 0 1 ${-this.props.radius},${bottomY} L ${-this.props.radius},0`
        return (
            <g transform={`translate(${this.props.x}, ${this.props.y})`}>
                {/* <rect x={textXOffset} y={-this.props.lineHeight-this.props.radius/2} width={maxTextWidth * this.props.fontSize / 2} height={this.props.lineHeight * textLines + this.props.radius} fill="white"/> */}
                <g onClick={() => this.setState({...this.state, displayInteractionTool: !this.state.displayInteractionTool})}>
                    <path id={`path-${this.id}`} stroke={this.props.color} strokeWidth={this.props.strokeWidth} fill="white">
                    </path>
                    <style>
                        {`
                        #path-${this.id} {
                            d: path('${collapsed_path}');
                            transition: d .5s ease;
                        }
                        #path-${this.id}:hover {
                            d: path('${expanded_path}');
                        }
                        }`}
                    </style>
                </g>
                {texts}
            </g>
        )
    }
}
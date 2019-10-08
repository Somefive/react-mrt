import React from 'react'
import { ReactComponent as IconThumbsUp } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDown } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import './node.css'

export default class Node extends React.Component {

    constructor(props) {
        super(props)
        this.state = {displayInteractionTool: false}
        this.id = randomstring.generate(8)
    }

    render() {
        let textColor = chroma(this.props.color).darken()
        let baseY = 0
        let textXOffset = this.props.radius * 1.5
        let maxTextWidth = 0
        let textLines = 0
        const texts = this.props.pins.map((pin, _idx) => {
            baseY = textLines * this.props.lineHeight
            return (
                <g key={_idx} transform={`translate(${textXOffset}, ${baseY})`}>
                    <text className="paper-text" id={`text-${this.id}-${_idx}`} fontSize={this.props.fontSize} fill={textColor}>
                        {pin.textPieces.map((_text, idx) => {
                            textLines++
                            maxTextWidth = Math.max(maxTextWidth, _text.length)
                            return <tspan key={idx} x="0" y={idx * this.props.lineHeight}>{_text}</tspan>
                        })}
                    </text>
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
                <g visibility={this.state.displayInteractionTool ? "none" : "hidden"}>
                    <IconThumbsUp x={-this.props.radius * 2.25} y={-this.props.radius * 1.5} fill="#00a000" width={this.props.radius} height={this.props.radius}/>
                    <IconThumbsDown x={-this.props.radius * 2.25} y={this.props.radius * 0.5} fill="#a00000" width={this.props.radius} height={this.props.radius}/>
                </g>
            </g>
        )
    }
}
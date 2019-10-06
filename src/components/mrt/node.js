import React from 'react'
import { ReactComponent as IconThumbsUp } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-up.svg'
import { ReactComponent as IconThumbsDown } from '@fortawesome/fontawesome-free/svgs/solid/thumbs-down.svg'

export default class Node extends React.Component {

    constructor(props) {
        super(props)
        this.state = {displayInteractionTool: false}
    }

    render() {
        const textSpans = this.props.textPieces.map((_text, idx) => 
            <tspan key={idx} x={this.props.radius * 2} y={idx * this.props.lineHeight}>{_text}</tspan>
        )
        return (
            <g transform={`translate(${this.props.x}, ${this.props.y})`}>
                <g style={{cursor: "pointer"}} onClick={() => this.setState({...this.state, displayInteractionTool: !this.state.displayInteractionTool})}>
                    <circle cx="0" cy="0" r="18" stroke={this.props.color} strokeWidth={this.props.strokeWidth} fill="white"/>
                    <text x="0" y="0" fontSize={this.props.fontSize - `${this.props.citations}`.length}
                          alignmentBaseline="central" textAnchor="middle">
                        {this.props.citations}
                    </text>
                </g>
                <text fontSize={this.props.fontSize}>{textSpans}</text>
                <g visibility={this.state.displayInteractionTool ? "none" : "hidden"}>
                    <IconThumbsUp x={-this.props.radius * 2.5} y={-this.props.radius * 1.5} fill="#00a000" width={this.props.radius} height={this.props.radius}/>
                    <IconThumbsDown x={-this.props.radius * 2.5} y={this.props.radius * 0.5} fill="#a00000" width={this.props.radius} height={this.props.radius}/>
                </g>
            </g>
        )
    }
}
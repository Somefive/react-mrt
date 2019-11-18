import React from 'react'
import { Icon } from 'antd'
import chroma from 'chroma-js'
import './tool.css'

export default class Tool extends React.Component {

    onClick() {
        if (this.props.onClick) this.props.onClick()
    }

    render() {
        const luminance = this.props.luminance || (this.props.primary ? 0.4 : 0.2)
        const color = chroma(this.props.color).luminance(luminance)
        const textColor = color.luminance(luminance / 2)
        const icon = (this.props.theme !== "twoTone") 
            ? <Icon className="toolicon" type={this.props.type} theme={this.props.theme} onClick={() => this.onClick()} style={{color: color.hex()}}/>
            : <Icon className="toolicon" type={this.props.type} theme={this.props.theme} onClick={() => this.onClick()} twoToneColor={color.hex()}/>
        return (
            <div className={`tool tooltip ${this.props.primary ? "primary" : "secondary"} ${this.props.className}`}>
                {icon}
                <span className="tooltip-text" style={{color: textColor.hex()}}>{this.props.tooltipText}</span>
                {this.props.children}
            </div>
        )
    }
}

import React from 'react'

export default class Layout extends React.Component {
    
    constructor(props) {
        super(props)
    }

    render() {
        const config = this.props.config
        const root = this.props.root, grid = this.props.grid
        console.log(root, grid)

        const _width = 1, _height = 1, extendedHeight = 1
        return (
        <svg width="100%" viewBox={`0 0 ${_width} ${_height+extendedHeight}`}>
            {/* {renderedColorDefs}
            <filter id="blur-filter">
                <feGaussianBlur stdDeviation={this.config.CellTextLineHeight} in="SourceGraphic"/>
            </filter>
            {renderedHeader}
            {
                clusterLabelTexts.map((texts, idx) => {
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 1 : 0}>
                        <rect x={this.config.CellWidth*idx*2} y={horizon} width={this.config.CellWidth*2} height={_height-horizon} fill={backgroundSolidColors[idx]}/>
                        <rect x={this.config.CellWidth*idx*2} y={_height} width={this.config.CellWidth*2} height={extendedHeight} fill={backgroundGradientSolidColors[idx]}/>
                        <g transform={`translate(${this.config.CellWidth*idx*2+this.config.CellOrbmentOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSolidColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
                    </g>
                })
            }
            {
                dataView.eras.map((era, idx) => 
                <g key={idx} className="mrt-era-background" transform={`translate(0, ${grid[idx][0].y - this.config.CellOrbmentRadius - this.config.CellPaddingTop + erasHeight[idx]})`}>
                    <rect className="mrt-era-background" x="0" y={-erasHeight[idx]} width={_width} height={erasHeight[idx]} opacity={(idx === this.state.focusEraIndex) ? 0.1 : 0}/>
                    <text className="mrt-era-background" fontSize={this.labelTextFontSize} x={this.config.CellPaddingLeft} y={-this.labelTextFontSize/2} opacity={(idx === this.state.focusEraIndex) ? 0.2 : 0}>
                        {era.from === era.to ? era.from : `${era.from} - ${era.to}`}
                    </text>
                </g>)
            }
            {
                gridT.map((branch, idx) => {
                    if (idx % 2 !== 0) return <text key={idx}/>
                    const _branch = branch.filter(node => node.pins.length > 0)
                    const _sibBranch = gridT[idx+1].filter(node => node.pins.length > 0)
                    if (_branch.length === 0 && _sibBranch.length === 0) return <text key={idx}/>
                    const fontSize = this.config.CellTextFontSize * 2
                    const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
                        (_sibBranch[0].y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) :
                        (_branch[0].y - this.config.CellTextLineHeight)) - fontSize / 2
                    const x = branch[0].x + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
                    const color = colorizer.CLUSTERS[Math.floor(idx / 2)].LABEL
                    return <text key={idx} x={x} y={y} fill={color} fontSize={fontSize}>{clusterNames[Math.floor(idx / 2)]}</text>
                })
            }
            {views.edges}
            {renderedOrbments}
            <g className="mrt-node-text-container">
                {renderedTexts}
            </g>
            {
                clusterLabelTexts.map((texts, idx) => {
                    const isCurrent = this.state.toExchange !== null && idx === this.state.toExchange.clusterID
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 0 : 1} visibility={this.state.toExchange === null ? "hidden" : "none"} onClick={() => onEdit("exchange", this.state.toExchange, idx)}>
                        <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={horizon} width={this.config.CellWidth*2} height={_height-horizon} fill={backgroundSelectionColors[idx]}/>
                        <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={_height} width={this.config.CellWidth*2} height={extendedHeight} fill={backgroundGradientSelectionColors[idx]}/>
                        <g className="mrt-background-text" style={{textDecoration: isCurrent ? "underline" : ""}} transform={`translate(${this.config.CellWidth*idx*2+this.config.CellOrbmentOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSelectionColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
                    </g>
                })
            }
            {
                <g opacity="0.5" transform={`translate(${_width}, ${_height+extendedHeight-this.labelTextLineHeight * 0.5})`}>                    
                    <Logo x={-this.labelTextFontSize * 3.35} y={-this.labelTextFontSize * 1.78} height={this.labelTextFontSize * 0.8} width={this.labelTextFontSize * 0.8}/>
                    <text x={-this.labelTextFontSize * 0.1} y={-this.labelTextFontSize * 0.05} textAnchor="end"
                        fontSize={this.labelTextFontSize * 0.75} fill={chroma("grey").luminance(0.3).hex()}>{(this.props.authors || []).join(', ')}
                    </text>
                    <text x={-this.labelTextFontSize * 0.1} y={-this.labelTextFontSize * 1} textAnchor="end"
                        fontSize={this.labelTextFontSize * 0.7} fill={chroma("grey").luminance(0.3).hex()}>AMiner
                    </text>
                </g>
            } */}
        </svg>)
    }
}
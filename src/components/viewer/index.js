import React from 'react'
import DefaultConfig from './default-config.json'
import DataEngine from './data-engine'
import randomstring from 'randomstring'
import _ from 'lodash'
import chroma from 'chroma-js'

export default class Viewer extends React.Component {

    renderCell(cell) {
        return <g key={randomstring.generate(4)}>
            {cell.nodes.map(node => 
                <text key={randomstring.generate(4)} fill={this.clusterColors[node.branch.cluster.id][node.branch.id]}>{
                    node.segments.lines.map((segment, segmentIdx) =>
                        <tspan key={segmentIdx} x={node.x} y={node.y + segmentIdx * this.config.CellTextLineHeight}>
                            {segment}
                        </tspan>
                    )
                }</text>
            )}
            <circle key={randomstring.generate(4)}
                    cx={cell.x+this.config.CellPaddingLeft+this.config.CellOrbmentRadius}
                    cy={cell.y+this.config.CellPaddingTop+this.config.CellOrbmentRadius}
                    r={this.config.CellOrbmentRadius}
                    stroke={this.clusterColors[cell.cluster.id][cell.branch.id]}
                    strokeWidth={this.config.CellStrokeWidth}
                    fill="white"/>
        </g>
    }

    renderCluster(cluster, grid) {

        grid.map((row, i) => row.map((cell, j) => {
            if (cell.isBranchTop) {
                if (cell.branch.id === 0) {

                }
            } else {
                return [{
                    x1: cell.x, y1: cell.topConnectionPoint,
                    x2: cell.x, y2: grid[i-1][j].bottomConnectionPoint,
                }]
            }
        }))
    }

    generateGradientColor(from, to, x1, y1, x2, y2) {
        const colorID = randomstring.generate(8)
        this.gradientColor.push(
            <defs key={colorID}>
                <linearGradient id={colorID} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                <stop offset="20%"  stopColor={from} />
                <stop offset="80%" stopColor={to} />
                </linearGradient>
            </defs>
        )
        return `url('#${colorID}')`
    }

    render() {
        const tBegin = new Date()
        this.config = {...DefaultConfig, ...this.props.config}
        const config = this.config
        config.CellTextOffsetX = config.CellPaddingLeft + 2 * config.CellOrbmentRadius + config.CellTextLeadMargin
        config.CellTextOffsetY = config.CellPaddingTop + config.CellOrbmentRadius
        config.CellWidth = config.CellTextOffsetX + config.CellTextWidth + config.CellPaddingRight
        config.CellTextExpandWidth = config.CellTextWidth + config.CellWidth

        const dataEngine = new DataEngine(config)
        dataEngine.load(this.props.data)
        console.log(dataEngine)

        this.rootColor = chroma.scale()(0.5)
        this.clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness()
            .colors(dataEngine.clusters.length).map(color => [
                chroma(color).luminance(0.1), chroma(color).luminance(0.2)
            ])
        this.gradientColor = []

        const cells = _.flatten(dataEngine.grid).filter(cell => cell.nodes.length > 0).map(cell => this.renderCell(cell))

        const _width = dataEngine.clusters.length * 2 * config.CellWidth
        const lastEra = dataEngine.eras[dataEngine.eras.length-1]
        const _height = lastEra.y + lastEra.height
        console.log("calculate time: ", (new Date() - tBegin) / 1000)
        return (
            <div className="viewer">
                <svg width="100%" viewBox={`0 0 ${_width} ${_height}`}>
                    <g fontSize={this.config.CellTextFontSize} fontWeight={this.config.CellTextFontWeight}>
                        {cells}
                    </g>
                </svg>
            </div>
        )
    }

}
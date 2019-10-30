import React from 'react'
import _ from 'lodash'
import randomstring from 'randomstring'
import { NodeText, CellText } from './node'
import { ReactComponent as Logo } from '../logo.svg'

const EDITBUTTONMARGINTOP = 10

export class Renderer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {toExchange: null, focusCell: null, focusPaper: null}
    }

    onEditChange(edits) {
        if (this.props.onEditChange) this.props.onEditChange(edits)
    }

    renderHeader(_width, horizon, headerBackgroundColor) {
        return (
            <g className="mrt-background">
                <rect x="0" y="0" width={_width} height={horizon} fill={headerBackgroundColor}/>
            </g>
        )
    }

    renderColorDefs(defs) {
        return defs.map(def => 
            <defs key={def.id}>
                <linearGradient id={def.id} x1={def.x1} y1={def.y1} x2={def.x2} y2={def.y2} gradientUnits="userSpaceOnUse">
                    <stop offset="20%" stopColor={def.from} />
                    <stop offset="80%" stopColor={def.to} />
                </linearGradient>
            </defs>
        )
    }

    renderText(cell, ncols, onEdit) {
        // return cell.pins.map((pin, idx) => <CellText key={idx} pin={pin} config={this.config}/>)
        return <NodeText key={randomstring.generate(4)}
            config={this.config}
            pins={cell.pins} 
            x={cell.x} y={cell.y}
            radius={this.config.CellOrbmentRadius}
            lineHeight={cell.lineHeight || this.config.CellTextLineHeight}
            secondaryLineHeight={cell.secondaryLineHeight || this.config.CellTextSecondaryLineHeight}
            textWidth={(cell.span - 1) * this.config.CellWidth + this.config.CellTextWidth}
            fullTextWidth={(cell.fullSpan - 1) * this.config.CellWidth + this.config.CellTextWidth}
            color={cell.color}
            textColor={cell.textColor}
            fontSize={cell.fontSize || this.config.CellTextFontSize}
            secondaryFontSize={cell.secondaryFontSize || this.config.CellTextSecondaryFontSize}
            strokeWidth={this.config.CellStrokeWidth}
            onEdit={onEdit}
            textLeadingMargin={this.config.CellTextLeadMargin}
            editable={typeof(cell.clusterID) !== "undefined"}
            editButtonMarginTop={EDITBUTTONMARGINTOP}
            scaleOrigin={(cell.branchID >= ncols - 2) ? "right" : ((cell.branchID === ncols - 3) ? "middle" : "left")}
            onExpand={(focusPaper) => this.setState({ focusPaper })}/>
    }

    renderTexts(grid, onEdit) {
        const ncols = grid[0].length
        return grid.map((row, i) => row.map((cell, j) => cell.pins.length > 0 && this.renderText(cell, ncols, onEdit) ))
    }

    renderOrbment(cell) {
        return <circle key={`${cell.x}-${cell.y}`} className="era-node-circle" cx={cell.x} cy={cell.y} r={this.config.CellOrbmentRadius}
        onMouseOver={() => this.setState({focusCell: cell}) }
        onMouseLeave={() => this.setState({focusCell: null})}
        stroke={cell.color} strokeWidth={this.config.CellStrokeWidth}
        fill={this.state.focusCell === cell ? cell.color : "white"}/>
    }

    renderOrbments(grid) {
        return grid.map((row, i) => row.map((cell, j) => cell.pins.length > 0 && 
            this.renderOrbment(cell)))
    }

    renderEdges(edges) {
        return edges.map((edge, idx) => 
            <line key={idx} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                strokeWidth={this.config.CellStrokeWidth - 1} stroke={edge.color}/>)
    }

    renderEras(eras, _width, config) {
        return eras.map((era, idx) => 
            <g key={idx} className="mrt-era-background">
                <rect className="mrt-era-background" x="0" y={era.y} 
                    width={_width} height={era.height} opacity={(this.state.focusCell && idx === this.state.focusCell.eraID) ? 0.1 : 0}/>
                <text className="mrt-era-background" fontSize={config.BottomLabelTextFontSize}
                    x={this.config.CellPaddingLeft} y={era.y + era.height - config.BottomLabelTextLineHeight / 2}
                    opacity={(this.state.focusCell && idx === this.state.focusCell.eraID) ? 0.2 : 0}>
                    {era.from === era.to ? era.from : `${era.from} - ${era.to}`}
                </text>
            </g>)
    }

    renderTopLabel(label) {
        return <text key={`${label.x}-${label.y}`} x={label.x} y={label.y} fill={label.color} fontSize={this.config.TopLabelTextFontSize}>
            {label.text}
        </text>
    }

    renderClusterLabels(clusterBottomLabels, clusterTopLabels, horizon, gradientY, bottomY, layout, selecting, onEdit) {
        const hidden = this.state.toExchange === null
        if (selecting) 
            return clusterBottomLabels.map((segments, idx) => {
                return <g className="mrt-background" key={idx} opacity={hidden ? 0 : 1}
                    visibility={hidden ? "hidden" : "none"} onClick={() => onEdit("exchange", this.state.toExchange, idx)}>
                    <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={horizon}
                        width={this.config.CellWidth*2} height={gradientY-horizon}
                        fill={layout.backgroundSelectionColors[idx]}/>
                    <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={gradientY} 
                        width={this.config.CellWidth*2} height={bottomY-gradientY}
                        fill={layout.backgroundGradientSelectionColors[idx]}/>
                    <text className="mrt-background-text" fontSize={this.config.BottomLabelTextFontSize}
                        fill={layout.backgroundTextSelectionColors[idx]}>
                        {segments.map((segment, sid) => 
                            <tspan key={sid} x={segment.x} y={segment.y}>{segment.word}</tspan>
                        )}
                    </text>
                </g>
            })
        else
            return clusterBottomLabels.map((segments, idx) => {
                return [(<g className="mrt-background" key={idx} opacity={hidden ? 1 : 0}>
                    <rect x={this.config.CellWidth*idx*2} y={horizon}
                        width={this.config.CellWidth*2} height={gradientY-horizon}
                        fill={layout.backgroundSolidColors[idx]}/>
                    <rect x={this.config.CellWidth*idx*2} y={gradientY} 
                        width={this.config.CellWidth*2} height={bottomY-gradientY}
                        fill={layout.backgroundGradientSolidColors[idx]}/>
                    <text fontSize={this.config.BottomLabelTextFontSize}
                        fill={layout.backgroundTextSolidColors[idx]}>
                        {segments.map((segment, sid) => 
                            <tspan key={sid} x={segment.x} y={segment.y}>{segment.word}</tspan>
                        )}
                    </text>
                </g>), this.renderTopLabel(clusterTopLabels[idx])]
            })
    }

    renderAuthors(authors, _width, bottomY, color) {
        return (
            <g opacity="0.5" transform={`translate(${_width}, ${bottomY-this.config.BottomLabelTextLineHeight * 0.5})`}>                    
                <Logo x={-this.config.BottomLabelTextFontSize * 3.35}
                    y={-this.config.BottomLabelTextFontSize * 1.78}
                    height={this.config.BottomLabelTextFontSize * 0.8}
                    width={this.config.BottomLabelTextFontSize * 0.8}/>
                <text x={-this.config.BottomLabelTextFontSize * 0.1}
                    y={-this.config.BottomLabelTextFontSize * 0.05} textAnchor="end"
                    fontSize={this.config.BottomLabelTextFontSize * 0.75}
                    fill={color}>{(authors || []).join(', ')}
                </text>
                <text x={-this.config.BottomLabelTextFontSize * 0.1} 
                    y={-this.config.BottomLabelTextFontSize * 1} textAnchor="end"
                    fontSize={this.config.BottomLabelTextFontSize * 0.7}
                    fill={color}>AMiner
                </text>
            </g>
        )
    }

    renderLinks(links) {
        if (!this.state.focusPaper) return
        const paths = [...(links.references[this.state.focusPaper.id] || []), ...(links.citations[this.state.focusPaper.id] || [])]
        return paths.map((path, idx) => {
            return <path key={idx} d={path.d}
                strokeWidth={this.config.CellLinkStroke} stroke={this.state.focusPaper.cell.color} fill="transparent"
                strokeDasharray={this.config.CellLinkStrokeArray}/>
        })
    }

    render() {
        performance.mark("renderer start")
        this.config = this.props.config
        const layout = this.props.layout
        const _width = this.props._width
        const bottomY = this.props.bottomY
        const root = this.props.root
        const ncols = this.props.ncols
        const onEdit = (action, source, param) => {
            let userEdits = {...this.props.userEdits}
            if (!userEdits[source.id] && (action === "thumb-up" || action === "thumb-down" || action === "exchange")) {
                userEdits[source.id] = {rate: 0, clusterID: source.clusterID}
            }
            if (action === "thumb-up" && userEdits[source.id].rate <= 0) {
                userEdits[source.id].rate = 1
                this.onEditChange(userEdits)
            } else if (action === "thumb-down" && userEdits[source.id].rate >= 0) {
                userEdits[source.id].rate = -1
                this.onEditChange(userEdits)
            } else if (action === "thumb-delete" && userEdits[source.id] && userEdits[source.id].rate !== 0) {
                userEdits[source.id].rate = 0
                this.onEditChange(userEdits)
            } else if (action === "to-exchange" && this.state.toExchange === null) {
                this.setState({toExchange: source})
            } else if (action === "exchange") {
                userEdits[source.id].clusterID = param
                this.onEditChange(userEdits)
                this.setState({toExchange: null})
            }
        }
        performance.mark("colordefs")
        const renderedColorDefs = this.renderColorDefs(this.props.defs)
        performance.measure("colordefs", "colordefs")
        performance.mark("texts")
        const renderedTexts = this.renderTexts(this.props.grid, onEdit)
        performance.measure("texts", "texts")
        performance.mark("header")
        const renderedHeader = this.renderHeader(this.props._width, this.props.horizon, layout.headerBackgroundColor)
        performance.measure("header", "header")
        performance.mark("orb")
        const renderedOrbments = this.renderOrbments(this.props.grid)
        performance.measure("orb", "orb")
        performance.mark("edge")
        const renderedEdges = this.renderEdges(this.props.edges)
        performance.measure("edge", "edge")
        performance.mark("link")
        const renderedLinks = this.renderLinks(this.props.links)
        performance.measure("link", "link")
        performance.mark("cluster label")
        const renderedClusterLabels = this.renderClusterLabels(this.props.clusterBottomLabels, this.props.clusterTopLabels, this.props.horizon, this.props.gradientY, bottomY, layout, false, onEdit)
        const renderedClusterSelectionLabels = this.renderClusterLabels(this.props.clusterBottomLabels, null, this.props.horizon, this.props.gradientY, bottomY, layout, true, onEdit)
        performance.measure("cluster label", "cluster label")
        performance.mark("era")
        const renderedEras = this.renderEras(this.props.eras, this.props._width, this.config)
        performance.measure("era", "era")
        performance.mark("author")
        const renderAuthors = this.renderAuthors(this.props.authors, this.props._width, bottomY, layout.authorColor)
        performance.measure("author", "author")

        performance.measure("renderer total", "renderer start")
        performance.getEntriesByType("measure").forEach(measure => {
            console.log(measure.name, measure.duration)
        })
        performance.clearMeasures()
        performance.clearMarks()

        return (
            <svg width="100%" viewBox={`0 0 ${_width} ${bottomY}`}>
                {renderedColorDefs}
                <filter id="blur-filter">
                    <feGaussianBlur stdDeviation={this.config.CellTextLineHeight} in="SourceGraphic"/>
                </filter>
                {renderedHeader}
                {renderedClusterLabels}
                {renderedEras}
                {renderedEdges} 
                {renderedOrbments}
                <g className="mrt-node-text-container">
                    {renderedTexts}
                </g>
                {this.renderOrbment(root)}
                {this.renderText(root, ncols, onEdit)}
                {renderedLinks}
                {renderedClusterSelectionLabels}
                {renderAuthors}
            </svg>
        )
    }

}

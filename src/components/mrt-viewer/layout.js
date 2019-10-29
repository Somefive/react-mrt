import React from 'react'
import _ from 'lodash'
import chroma from 'chroma-js'
import randomstring from 'randomstring'
import { NodeText } from './node'
import { ReactComponent as Logo } from '../logo.svg'

const EDITBUTTONMARGINTOP = 10

class Renderer extends React.Component {

    constructor(props) {
        super(props)
        this.state = {toExchange: null, focusCell: null}
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
                <stop offset="20%"  stopColor={def.from} />
                <stop offset="80%" stopColor={def.to} />
                </linearGradient>
            </defs>
        )
    }

    renderText(cell, ncols, onEdit) {
        return <NodeText key={randomstring.generate(4)}
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
            scaleOrigin={(cell.branchID >= ncols - 2) ? "right" : ((cell.branchID === ncols - 3) ? "middle" : "left")}/>
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
        return <text x={label.x} y={label.y} fill={label.color} fontSize={this.config.TopLabelTextFontSize}>
            {label.text}
        </text>
    }

    renderClusterLabels(clusterBottomLabels, clusterTopLabels, horizon, gradientY, bottomY, layout, hidden, selecting, onEdit) {
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
                return <g className="mrt-background" key={idx} opacity={hidden ? 1 : 0}>
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
                    {this.renderTopLabel(clusterTopLabels[idx])}
                </g>
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

        const renderedColorDefs = this.renderColorDefs(this.props.defs)
        const renderedTexts = this.renderTexts(this.props.grid, onEdit)
        const renderedHeader = this.renderHeader(this.props._width, this.props.horizon, layout.headerBackgroundColor)
        const renderedOrbments = this.renderOrbments(this.props.grid)
        const renderedEdges = this.renderEdges(this.props.edges)
        const renderedClusterLabels = this.renderClusterLabels(this.props.clusterBottomLabels, this.props.clusterTopLabels, this.props.horizon, this.props.gradientY, bottomY, layout, this.state.toExchange === null, false, onEdit)
        const renderedClusterSelectionLabels = this.renderClusterLabels(this.props.clusterBottomLabels, null, this.props.horizon, this.props.gradientY, bottomY, layout, this.state.toExchange === null, true, onEdit)
        const renderedEras = this.renderEras(this.props.eras, this.props._width, this.config)
        const renderAuthors = this.renderAuthors(this.props.authors, this.props._width, bottomY, layout.authorColor)

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
                {renderedClusterSelectionLabels}
                {renderAuthors}
            </svg>
        )
    }

}

export default class Layout extends React.Component {
    
    constructor(props) {
        super(props)
    }
    
    initConfig() {
        const config = this.props.config
        config.CellOrbmentOffsetX = config.CellPaddingLeft + config.CellOrbmentRadius
        config.CellOrbmentOffsetY = config.CellPaddingTop + config.CellOrbmentRadius
        config.CellTextOffsetX = config.CellOrbmentOffsetX + config.CellOrbmentRadius + config.CellTextLeadMargin
        config.CellTextOffsetY = config.CellOrbmentOffsetY
        config.CellWidth = config.CellTextOffsetX + config.CellTextWidth + config.CellPaddingRight
        config.CellTextExpandWidth = config.CellTextWidth + config.CellWidth
        this.config = config
        return config
    }

    initAuxFunc() {
        this.nodeTextFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextSecondaryFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextSecondaryFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextCustomizeFold = (text, span, fontSize) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (fontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
    }

    initColors(ncols) {
        // This is slow
        this.rootColor = chroma.scale()(0.5)
        this.rootTextColor = chroma(this.rootColor).darken().hex()
        this.headerBackgroundColor = chroma(this.rootColor).luminance(0.9)
        this.clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(Math.floor(ncols / 2))
        this.branchColors = _.range(0, ncols).map(j => chroma(this.clusterColors[Math.floor(j / 2)]).luminance(j % 2 === 0 ? 0.25 : 0.5))
        this.branchTextColors = this.branchColors.map(color => chroma(color).darken().hex())
        this.clusterTopLabelColors = this.clusterColors.map(color => chroma(color).luminance(0.5).darken(2))
        this.authorColor = chroma("grey").luminance(0.3).hex()
        this.defs = []
    }

    initBackgroundColors(grid, gradientY, bottomY) {
        // This is particularly slow
        const nrows = grid.length
        this.backgroundSolidColors = this.clusterColors.map(color => chroma(color).luminance(0.9))
        this.backgroundTextSolidColors = this.clusterColors.map(color => chroma(color).luminance(0.7))
        this.backgroundGradientSolidColors = this.clusterColors.map((color, idx) => {
            const x = grid[nrows-1][idx*2].x
            return this.gradientColor(chroma(color).luminance(0.9), "white", x, gradientY, x, bottomY)
        })
        this.backgroundSelectionColors = this.clusterColors.map(color => chroma(color).luminance(0.5))
        this.backgroundTextSelectionColors = this.clusterColors.map(color => chroma(color).luminance(0.2))
        this.backgroundGradientSelectionColors = this.clusterColors.map((color, idx) => {
            const x = grid[nrows-1][idx*2].x
            return this.gradientColor(chroma(color).luminance(0.5), "white", x, gradientY, x, bottomY)
        })
    }

    gradientColor(from, to, x1, y1, x2, y2) {
        const id = randomstring.generate(8)
        this.defs.push({id, from, to, x1, y1, x2, y2})
        return `url('#${id}')`
    }

    placeRoot(root, ncols) {
        root.x = this.config.CellWidth * (ncols - 1) / 2 + this.config.CellOrbmentOffsetX
        root.y = this.config.CellOrbmentOffsetY
        root.expandable = true
        root.span = ncols / 4
        root.fullSpan = ncols / 4
        root.color = this.rootColor
        root.textColor = this.rootTextColor
        root.fontSize = this.config.CellTextFontSize * 1.5
        root.secondaryFontSize = this.config.CellTextSecondaryFontSize * 1.5
        root.lineHeight = this.config.CellTextLineHeight * 1.5
        root.secondaryLineHeight = this.config.CellTextSecondaryLineHeight * 1.5
        root.pins = [{...root, 
            x: root.x,
            y: root.y,
            textPieces: this.nodeTextCustomizeFold(root.text, root.span, root.fontSize), 
            fullTextPieces: this.nodeTextCustomizeFold(root.text, root.fullSpan, root.fontSize),
            abstractPieces: this.nodeTextCustomizeFold(root.abstract, root.fullSpan, root.secondaryFontSize),
            edits: this.props.userEdits[root.id]
        }]
        root.pins[0].height = root.pins[0].textPieces.length * this.config.CellTextLineHeight
        const _y = root.y + root.pins[0].height + this.config.CellTextMargin
        root.height = Math.max(
            _y - this.config.CellTextOffsetY - root.y + this.config.CellPaddingBottom,
            this.config.CellPaddingTop + 2 * this.config.CellOrbmentRadius + this.config.CellPaddingBottom
        )
    }

    placeGrid(grid, eras, horizon) {
        const ncols = grid[0].length
        let y = horizon + this.config.HorizonMarginBottom
        grid.forEach((row, i) => {
            eras[i].y = y
            row.forEach((cell, j) => {
                let _y = y + this.config.CellTextOffsetY
                cell.x = this.config.CellWidth * j + this.config.CellOrbmentOffsetX
                cell.y = _y
                cell.color = this.branchColors[j]
                cell.textColor = this.branchTextColors[j]
                // if (cell.pins.length === 0) return
                cell.expandable = (j+1 < ncols)
                    && (cell.pins.length > 0)
                    && (row[j+1].pins.length === 0)
                    && (!this.config.disableTextBranchSpan)
                    && (!this.config.DisableTextClusterSpan || j % 2 === 0)
                cell.span = cell.expandable ? 2 : 1
                cell.fullSpan = (j+1 < ncols) ? 2 : 1
                cell.pins.forEach(pin => {
                    pin.x = cell.x
                    pin.y = _y
                    pin.textPieces = this.nodeTextFold(pin.text, cell.span)
                    pin.fullTextPieces = this.nodeTextFold(pin.text, cell.fullSpan)
                    pin.abstractPieces = this.nodeTextSecondaryFold(pin.abstract, cell.fullSpan)
                    pin.height = pin.textPieces.length * this.config.CellTextLineHeight
                    _y += pin.height + this.config.CellTextMargin
                })
                cell.overlayed = j > 0 && row[j-1].expandable
                cell.height = Math.max(
                    _y - this.config.CellTextOffsetY - y + this.config.CellPaddingBottom,
                    this.config.CellPaddingTop + 2 * this.config.CellOrbmentRadius + this.config.CellPaddingBottom
                )
            })
            eras[i].height = row.reduce((prev, cell) => Math.max(prev, cell.height), 0)
            y += eras[i].height
        })
    }

    placeEdges(root, gridT, ncols, horizon) {
        const edges = []
        const addEdge = (x1, y1, x2, y2, color) => edges.push({x1, y1, x2, y2, color})
        const addVerticalEdge = (x, y1, y2, color) => addEdge(x, y1, x, y2, color)
        const addHorizontalEdge = (x1, x2, y, color) => addEdge(x1, y, x2, y, color)
        {
            const cell = root, cellLeft = gridT[0][0], cellRight = gridT[ncols - 2][0]
            addVerticalEdge(cell.x, cell.y, horizon, this.rootColor)
            addHorizontalEdge(cellLeft.x, cellRight.x, horizon, this.rootColor)
        }
        gridT.forEach((branch, branchID) => {
            const _branch = branch.filter(cell => cell.pins.length > 0)
            if (_branch.length === 0 && branchID % 2 === 1) return
            const startEra = (branchID % 2 === 0) ? 0 : _branch[0].eraID
            let endEra = (_branch.length > 0) ? _branch[_branch.length-1].eraID : 0
            if (branchID % 2 === 0) {
                const _nextBranch = gridT[branchID+1].filter(cell => cell.pins.length > 0)
                if (_nextBranch.length > 0) endEra = Math.max(endEra, _nextBranch[0].eraID)
            }
            for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
                let cell = branch[eraID]
                const yStart = cell.overlayed ? (cell.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : cell.y
                cell = branch[eraID-1]
                let sib = branchID > 0 ? gridT[branchID-1][eraID-1] : null
                const yEnd = cell.overlayed ? (cell.y - this.config.CellOrbmentOffsetY + sib.height - this.config.CellPaddingBottom + this.config.CellTextLineHeight) : cell.y
                addVerticalEdge(cell.x, yStart, yEnd, cell.color)
            }
            if (branchID % 2 === 0) {
                const cell = branch[0]
                const yEnd = cell.overlayed ? (cell.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : cell.y
                addVerticalEdge(cell.x, horizon, yEnd, this.gradientColor(this.rootColor, cell.color, cell.x, horizon, cell.x, yEnd))
            } else {
                const cell = branch[startEra]
                const sib = gridT[branchID-1][startEra]
                const yEnd = cell.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight
                const yStart = cell.y
                addVerticalEdge(cell.x, yStart, yEnd, cell.color)
                addHorizontalEdge(cell.x, sib.x, yEnd, this.gradientColor(cell.color, sib.color, cell.x, yEnd, sib.x, yEnd))
            }
        })
        return edges
    }

    placeClusterBottomLabels(y, clusterWords) {
        // const clusterLabelsHeight = _.max(clusterWords.map(pieces => pieces.length)) * this.config.BottomLabelTextLineHeight
        return clusterWords.map((pieces, clusterID) => pieces.reverse().map((word, idx) => { return {
            word,
            x: clusterID * 2 * this.config.CellWidth + this.config.CellPaddingLeft + this.config.CellOrbmentRadius,
            y: y - idx * this.config.BottomLabelTextLineHeight
        }}))
    }

    placeClusterTopLabels(gridT, clusterNames) {
        return _.range(0, gridT.length , 2).map(idx => {
            const branch = gridT[idx]
            const _branch = branch.filter(cell => cell.pins.length > 0)
            const _sibBranch = gridT[idx+1].filter(cell => cell.pins.length > 0)
            if (_branch.length === 0 && _sibBranch.length === 0) return <text key={idx}/>
            const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
                (_sibBranch[0].y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) :
                (_branch[0].y - this.config.CellTextLineHeight)) - this.config.TopLabelTextLineHeight / 2
            const x = branch[0].x + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
            const color = this.clusterTopLabelColors[Math.floor(idx / 2)]
            const text = clusterNames[Math.floor(idx / 2)]
            return {x, y, color, text}
        })
    }

    render() {
        performance.mark("layout start")
        this.initConfig()
        this.initAuxFunc()
        const root = this.props.root, grid = this.props.grid, gridT = this.props.gridT, eras = this.props.eras
        const clusterNames = this.props.clusterNames, clusterWords = clusterNames.map(name => name.split(' '))
        const authors = this.props.authors
        const ncols = grid[0].length
        // const renderer = new Renderer(this.config)
        this.initColors(ncols)
        performance.measure("layout init", "layout start")
        
        performance.mark("layout init")
        this.placeRoot(root, ncols)
        const horizon = root.height + this.config.HorizonMarginTop
        this.placeGrid(grid, eras, horizon)
        const _height = grid[grid.length-1].reduce((prev, cell) => Math.max(cell.y+cell.height, prev), 0)
        performance.measure("layout place grid", "layout init")

        console.log(this.config, root, grid, eras)

        // this.disableTextBranchSpan = this.props.disableTextBranchSpan
        // this.disableTextClusterSpan = this.props.disableTextClusterSpan

        // this.nodeFontExtraSize = this.props.fontExtraSize || 0

        const edges = this.placeEdges(root, gridT, ncols, horizon)
        
        const gradientY = _height

        const clusterLabelsHeight = _.max(clusterWords.map(words => words.length)) * this.config.BottomLabelTextLineHeight
        const bottomY = grid[grid.length-1].reduce((prev, cell) => 
            Math.max(prev, cell.pins.length > 0
                ? _.max(cell.pins.map(pin => 
                    pin.y + (pin.fullTextPieces.length - 1) * this.config.CellTextLineHeight * 2 + pin.abstractPieces.length * this.config.CellTextSecondaryLineHeight + this.config.CellTextLineHeight * 2
                ))
                : 0
        ), gradientY + clusterLabelsHeight)
        const clusterBottomLabels = this.placeClusterBottomLabels(gradientY + clusterLabelsHeight, clusterWords)
        const clusterTopLabels = this.placeClusterTopLabels(gridT, clusterNames)

        // const renderNodes = _.flattenDeep(grid).sort((a, b) => (a.eraID === b.eraID) ? (b.branchID - a.branchID) : (b.eraID - a.eraID))
        // renderNodes.push(root)
        // console.log(renderNodes)

        const _width = this.config.CellWidth * ncols
        
        performance.measure("before bgcolor", "layout start")

        this.initBackgroundColors(grid, gradientY, bottomY)
        
        performance.measure("layout total", "layout start")
        
        return <Renderer
            config={this.config} authors={authors}
            defs={this.defs}
            root={root} grid={grid} edges={edges} eras={eras} ncols={ncols}
            clusterBottomLabels={clusterBottomLabels} clusterTopLabels={clusterTopLabels}
            horizon={horizon} _width={_width} gradientY={gradientY} bottomY={bottomY}
            layout={this} userEdits={this.props.userEdits}
            onEditChange={this.props.onEditChange}
        />
    }
}
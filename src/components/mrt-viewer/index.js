import React from 'react'
import { NodeText } from './node'
import randomstring from 'randomstring'
import _ from 'lodash'
import './index.css'
import DefaultConfig from './default-config.json'
import DataView from './data-view'
import Layout from './layout'

export default class MRTViewer extends React.Component {

    constructor(props) {
        super(props)

        this.labelTextFontSize = 64
        this.labelTextLineHeight = 72

        this.nodeFullSpan = 2

        this.nodeEditButtonMarginTop = 10

        // this.state = {toExchange: null, focusEraIndex: -1}
    }

    onEditChange(edits) {
        if (this.props.onEditChange) this.props.onEditChange(edits)
    }

    renderText(cell, ncols, onEdit) {
        return <NodeText key={randomstring.generate(4)}
            pins={cell.pins} 
            x={cell.x} y={cell.y}
            radius={this.config.CellOrbmentRadius}
            lineHeight={this.config.CellTextLineHeight}
            secondaryLineHeight={this.config.CellTextSecondaryLineHeight}
            textWidth={(cell.span - 1) * this.config.CellWidth + this.config.CellTextWidth}
            fullTextWidth={(cell.fullSpan - 1) * this.config.CellWidth + this.config.CellTextWidth}
            color={cell.color}
            fontSize={this.config.CellTextFontSize}
            secondaryFontSize={this.config.CellTextSecondaryFontSize}
            strokeWidth={this.config.CellStrokeWidth}
            onEdit={onEdit}
            textLeadingMargin={this.config.CellTextLeadMargin}
            editable={typeof(cell.clusterID) !== "undefined"}
            editButtonMarginTop={this.nodeEditButtonMarginTop}
            scaleOrigin={(cell.branchID >= ncols - 2) ? "right" : ((cell.branchID === ncols - 3) ? "middle" : "left")}/>
    } 

    renderTexts(grid, onEdit) {
        const ncols = grid[0].length
        return grid.map((row, i) => row.map((cell, j) => cell.pins.length > 0 && this.renderText(cell, ncols, onEdit) ))
    }

    renderHeader(_width, horizon, colorizer, root, ncols, onEdit) {
        return (
            <g className="mrt-background">
                <rect x="0" y="0" width={_width} height={horizon} fill={colorizer.ROOT.BACKGROUND}/>
                {this.renderText(root, ncols, onEdit)}
            </g>
        )
    }

    renderColorDefs(colorizer) {
        return colorizer.defs.map(def => 
            <defs key={def.id}>
                <linearGradient id={def.id} x1={def.x1} y1={def.y1} x2={def.x2} y2={def.y2} gradientUnits="userSpaceOnUse">
                <stop offset="20%"  stopColor={def.from} />
                <stop offset="80%" stopColor={def.to} />
                </linearGradient>
            </defs>
        )
    }

    renderOrbment(cell) {
        return <circle className="era-node-circle" cx={cell.x} cy={cell.y} r={this.config.CellOrbmentRadius}
        onMouseOver={() => this.setState({focusEraIndex: cell.eraID}) }
        onMouseLeave={() => this.setState({focusEraIndex: -1})}
        stroke={cell.color} strokeWidth={this.config.CellStrokeWidth}
        fill="white"/>
    }

    renderOrbments(grid) {
        return grid.map((row, i) => row.map((cell, j) => cell.pins.length > 0 && 
            this.renderOrbment(cell)))
    }

    render() {
        performance.mark("start")
        this.config = {...DefaultConfig, ...this.props.config}

        // const narrow_wrap = d3plus.textWrap()
        //     .fontSize(this.config.CellTextFontSize)
        //     .lineHeight(this.config.CellTextLineHeight)
        //     .fontWeight(this.config.CellTextFontWeight)
        //     .width(this.config.CellTextWidth)
        // const wide_wrap = d3plus.textWrap()
        //     .fontSize(this.config.CellTextFontSize)
        //     .lineHeight(this.config.CellTextLineHeight)
        //     .fontWeight(this.config.CellTextFontWeight)
        //     .width(this.config.CellTextExpandWidth)
        // const narrow_secondary_wrap = d3plus.textWrap()
        //     .fontSize(this.config.CellTextSecondaryFontSize)
        //     .lineHeight(this.config.CellTextSecondaryLineHeight)
        //     .fontWeight(this.config.CellTextSecondaryFontWeight)
        //     .width(this.config.CellTextWidth)
        // const wide_secondary_wrap = d3plus.textWrap()
        //     .fontSize(this.config.CellTextSecondaryFontSize)
        //     .lineHeight(this.config.CellTextSecondaryLineHeight)
        //     .fontWeight(this.config.CellTextSecondaryFontWeight)
        //     .width(this.config.CellTextExpandWidth)
        
        const dataView = new DataView(this.props.data, this.props.userEdits, this.config)
        performance.measure("dataView creation", "start")
        // const root = dataView.root, grid = dataView.grid
        // const [nrows, ncols] = dataView.gridShape
        const clusterNames = this.props.data.clusterNames.map(name => name.split(' ').map(_.capitalize).join(' '))

        // this.disableTextBranchSpan = this.props.disableTextBranchSpan
        // this.disableTextClusterSpan = this.props.disableTextClusterSpan

        // this.nodeFontExtraSize = this.props.fontExtraSize || 0

        // // initialize views
        // const colorizer = new Colorizer(grid)
        // const clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(Math.floor(ncols / 2))
        
        // let views = {defs: [], nodes: {}, edges: []}
        // const addEdge = (x1, y1, x2, y2, color) => views.edges.push(<line key={views.edges.length} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={this.config.CellStrokeWidth - 1} stroke={color}/>)
        // const addVerticalEdge = (x, y1, y2, color) => addEdge(x, y1, x, y2, color)
        // const addHorizontalEdge = (x1, x2, y, color) => addEdge(x1, y, x2, y, color)

        // // Arrange coornidates for each era node
        // root.x = this.config.CellWidth * (ncols - 1) / 2 + this.config.CellOrbmentOffsetX
        // root.y = this.config.CellOrbmentOffsetY
        // root.color = colorizer.ROOT.STROKE
        // root.pins = [{...root, 
        //     textPieces: this.nodeTextFold(root.text, 2), 
        //     fullTextPieces: this.nodeTextFold(root.text, 2),
        //     abstractPieces: this.nodeTextSecondaryFold(root.abstract, 2),

        //     // textPieces: wide_wrap(root.text).lines, 
        //     // fullTextPieces: wide_wrap(root.text).lines,
        //     // abstractPieces: wide_secondary_wrap(root.abstract).lines,
        //     edits: this.props.userEdits[root.id]
        // }]
        // root.span = 2
        // root.fullSpan = this.nodeFullSpan
        // root.lines = this.nodeTextLines(root)
        // root.height = this.nodeHeight(root.lines)

        // grid.forEach((row, eraID) => row.forEach((cell, branchID) => {
        //     cell.x = this.config.CellWidth * branchID + this.config.CellOrbmentOffsetX
        //     cell.color = colorizer.BRANCHES[branchID].STROKE
        //     if (cell.pins.length === 0) return
        //     cell.span = (branchID < ncols - 1 && grid[eraID][branchID+1].pins.length === 0
        //         && !this.disableTextBranchSpan && (!this.disableTextClusterSpan || branchID % 2 === 0)) ? 2 : 1
        //     cell.fullSpan = (branchID < ncols - 1) ? this.nodeFullSpan : 1
        //     cell.pins.forEach(pin => {
        //         pin.textPieces = this.nodeTextFold(pin.text, cell.span)
        //         pin.fullTextPieces = this.nodeTextFold(pin.text, cell.fullSpan)
        //         pin.abstractPieces = this.nodeTextSecondaryFold(pin.abstract, cell.fullSpan)

        //         // pin.textPieces = (node.span > 1 ? wide_wrap : narrow_wrap)(pin.text).lines
        //         // pin.fullTextPieces = (node.fullSpan > 1 ? wide_wrap : narrow_wrap)(pin.text).lines
        //         // pin.abstractPieces = (node.fullSpan > 1 ? wide_secondary_wrap : narrow_secondary_wrap)(pin.abstract).lines
        //     })
        //     cell.lines = this.nodeTextLines(cell)
        //     cell.height = this.nodeHeight(cell.lines)
        // }))

        // const horizon = root.height + this.config.HorizonMarginTop
        // let _height = horizon + this.config.HorizonMarginBottom
        // const erasHeight = grid.map(row => {
        //     row.forEach(cell => cell.y = _height + this.config.CellOrbmentOffsetY)
        //     const eraHeight = row.reduce((prev, cell) => Math.max(prev, cell.height || 0), 0)
        //     _height += eraHeight
        //     return eraHeight
        // })

        // {
        //     const node = root, nodeLeft = grid[0][0], nodeRight = grid[0][ncols - 2]
        //     addVerticalEdge(node.x, node.y, horizon, colorizer.ROOT.STROKE)
        //     addHorizontalEdge(nodeLeft.x, nodeRight.x, horizon, colorizer.ROOT.STROKE)
        // }

        // const gridT = grid[0].map((col, i) => grid.map(row => row[i]))
        // gridT.forEach((branch, branchID) => {
        //     const _branch = branch.filter(node => node.pins.length > 0)
        //     if (_branch.length === 0 && branchID % 2 === 1) return
        //     const startEra = (branchID % 2 === 0) ? 0 : _branch[0].eraID
        //     let endEra = (_branch.length > 0) ? _branch[_branch.length-1].eraID : 0
        //     if (branchID % 2 === 0) {
        //         const _nextBranch = gridT[branchID+1].filter(node => node.pins.length > 0)
        //         if (_nextBranch.length > 0) endEra = Math.max(endEra, _nextBranch[0].eraID)
        //     }
        //     const shrinkFlag = !this.disableTextBranchSpan && (!(this.disableTextClusterSpan && branchID % 2 === 0))
        //     for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
        //         let node = branch[eraID]
        //         let sib = branchID > 0 ? grid[eraID][branchID-1] : null
        //         const yStart = (shrinkFlag && node.pins.length === 0 && ((branchID > 0 && sib.pins.length > 0) || (eraID === endEra))) ? (node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : node.y
        //         node = branch[eraID-1]
        //         sib = branchID > 0 ? grid[eraID-1][branchID-1] : null
        //         const yEnd = (shrinkFlag && node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.config.CellOrbmentOffsetY + this.nodeHeight(this.nodeTextLines(sib)) - this.config.CellPaddingBottom + this.config.CellTextLineHeight) : node.y
        //         addVerticalEdge(node.x, yStart, yEnd, node.color)
        //     }
        //     if (branchID % 2 === 0) {
        //         const node = branch[0]
        //         const sib = branchID > 0 ? grid[0][branchID-1] : null
        //         const yEnd = (shrinkFlag && node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : node.y
        //         addVerticalEdge(node.x, horizon, yEnd, colorizer.gradientColor(colorizer.ROOT.STROKE, node.color, node.x, horizon, node.x, yEnd))
        //     } else {
        //         const node = branch[startEra]
        //         const sib = grid[startEra][branchID-1]
        //         const yEnd = node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight
        //         const yStart = node.y
        //         addVerticalEdge(node.x, yStart, yEnd, node.color)
        //         addHorizontalEdge(node.x, sib.x, yEnd, colorizer.gradientColor(node.color, sib.color, node.x, yEnd, sib.x, yEnd))
        //     }
        // })
        
        // const onEdit = (action, source, param) => {
        //     let userEdits = {...this.props.userEdits}
        //     if (!userEdits[source.id] && (action === "thumb-up" || action === "thumb-down" || action === "exchange")) {
        //         userEdits[source.id] = {rate: 0, clusterID: source.clusterID}
        //     }
        //     if (action === "thumb-up" && userEdits[source.id].rate <= 0) {
        //         userEdits[source.id].rate = 1
        //         this.onEditChange(userEdits)
        //     } else if (action === "thumb-down" && userEdits[source.id].rate >= 0) {
        //         userEdits[source.id].rate = -1
        //         this.onEditChange(userEdits)
        //     } else if (action === "thumb-delete" && userEdits[source.id] && userEdits[source.id].rate !== 0) {
        //         userEdits[source.id].rate = 0
        //         this.onEditChange(userEdits)
        //     } else if (action === "to-exchange" && this.state.toExchange === null) {
        //         this.setState({toExchange: source})
        //     } else if (action === "exchange") {
        //         userEdits[source.id].clusterID = param
        //         this.onEditChange(userEdits)
        //         this.setState({toExchange: null})
        //     }
        // }

        // const extendedBottomY = grid[grid.length-1].reduce((prev, cell) => {
        //     let centerY = cell.y
        //     cell.pins.forEach(pin => {
        //         prev = Math.max(prev, centerY + (pin.fullTextPieces.length - 1) * this.config.CellTextLineHeight * 2 + pin.abstractPieces.length * this.config.CellTextSecondaryLineHeight + this.config.CellTextLineHeight * 2)
        //         centerY += pin.textPieces.length * this.config.CellTextLineHeight
        //     })
        //     return prev
        // }, _height)

        // const renderNodes = _.flattenDeep(grid).sort((a, b) => (a.eraID === b.eraID) ? (b.branchID - a.branchID) : (b.eraID - a.eraID))
        // renderNodes.push(root)
        // console.log(renderNodes)

        // const _width = this.config.CellWidth * ncols
        // const clusterLabelTextPieces = clusterNames.map(name => name.split(' '))
        // const clusterLabelTexts = clusterLabelTextPieces.map((pieces, _idx) => 
        //     <text key={_idx}>
        //         {pieces.reverse().map((_text, idx) => <tspan key={idx} x="0" y={-idx * this.labelTextLineHeight}>{_text}</tspan>)}
        //     </text>
        // )
        // const clusterLabelsHeight = clusterLabelTextPieces.reduce((prev, pieces) => Math.max(prev, pieces.length), 0) * this.labelTextLineHeight
        // _height += clusterLabelsHeight + this.labelTextLineHeight

        // const extendedHeight = Math.max(this.labelTextLineHeight * 1.5, extendedBottomY - _height)
        // const backgroundSolidColors = clusterColors.map(color => chroma(color).luminance(0.9))
        // const backgroundTextSolidColors = clusterColors.map(color => chroma(color).luminance(0.7))
        // const backgroundGradientSolidColors = clusterColors.map((color, idx) => {
        //     const x = grid[nrows-1][idx*2].x
        //     return colorizer.gradientColor(chroma(color).luminance(0.9), "white", x, _height, x, _height+extendedHeight)
        // })
        // const backgroundSelectionColors = clusterColors.map(color => chroma(color).luminance(0.5))
        // const backgroundTextSelectionColors = clusterColors.map(color => chroma(color).luminance(0.2))
        // const backgroundGradientSelectionColors = clusterColors.map((color, idx) => {
        //     const x = grid[nrows-1][idx*2].x
        //     return colorizer.gradientColor(chroma(color).luminance(0.5), "white", x, _height, x, _height+extendedHeight)
        // })

        
        // const renderedColorDefs = this.renderColorDefs(colorizer)
        // const renderedTexts = this.renderTexts(grid, onEdit)
        // const renderedHeader = this.renderHeader(_width, horizon, colorizer, root, ncols, onEdit)
        // const renderedOrbments = this.renderOrbments(grid)        

        performance.measure("total", "start")
        performance.getEntriesByType("measure").forEach(measure => {
            console.log(measure.name, measure.duration)
        })

        return <Layout
            config={this.config}
            root={dataView.root} grid={dataView.grid} gridT={dataView.gridT} eras={dataView.eras}
            clusterNames={clusterNames} authors={this.props.authors}
            userEdits={this.props.userEdits}
        />

        // return <svg className="mrt" id={this.props.id} width="100%" viewBox={`0 0 ${_width} ${_height+extendedHeight}`}>
        //     {renderedColorDefs}
        //     <filter id="blur-filter">
        //         <feGaussianBlur stdDeviation={this.config.CellTextLineHeight} in="SourceGraphic"/>
        //     </filter>
        //     {renderedHeader}
        //     {
        //         clusterLabelTexts.map((texts, idx) => {
        //             return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 1 : 0}>
        //                 <rect x={this.config.CellWidth*idx*2} y={horizon} width={this.config.CellWidth*2} height={_height-horizon} fill={backgroundSolidColors[idx]}/>
        //                 <rect x={this.config.CellWidth*idx*2} y={_height} width={this.config.CellWidth*2} height={extendedHeight} fill={backgroundGradientSolidColors[idx]}/>
        //                 <g transform={`translate(${this.config.CellWidth*idx*2+this.config.CellOrbmentOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSolidColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
        //             </g>
        //         })
        //     }
        //     {
        //         dataView.eras.map((era, idx) => 
        //         <g key={idx} className="mrt-era-background" transform={`translate(0, ${grid[idx][0].y - this.config.CellOrbmentRadius - this.config.CellPaddingTop + erasHeight[idx]})`}>
        //             <rect className="mrt-era-background" x="0" y={-erasHeight[idx]} width={_width} height={erasHeight[idx]} opacity={(idx === this.state.focusEraIndex) ? 0.1 : 0}/>
        //             <text className="mrt-era-background" fontSize={this.labelTextFontSize} x={this.config.CellPaddingLeft} y={-this.labelTextFontSize/2} opacity={(idx === this.state.focusEraIndex) ? 0.2 : 0}>
        //                 {era.from === era.to ? era.from : `${era.from} - ${era.to}`}
        //             </text>
        //         </g>)
        //     }
        //     {
        //         gridT.map((branch, idx) => {
        //             if (idx % 2 !== 0) return <text key={idx}/>
        //             const _branch = branch.filter(node => node.pins.length > 0)
        //             const _sibBranch = gridT[idx+1].filter(node => node.pins.length > 0)
        //             if (_branch.length === 0 && _sibBranch.length === 0) return <text key={idx}/>
        //             const fontSize = this.config.CellTextFontSize * 2
        //             const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
        //                 (_sibBranch[0].y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) :
        //                 (_branch[0].y - this.config.CellTextLineHeight)) - fontSize / 2
        //             const x = branch[0].x + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
        //             const color = colorizer.CLUSTERS[Math.floor(idx / 2)].LABEL
        //             return <text key={idx} x={x} y={y} fill={color} fontSize={fontSize}>{clusterNames[Math.floor(idx / 2)]}</text>
        //         })
        //     }
        //     {views.edges}
        //     {renderedOrbments}
        //     <g className="mrt-node-text-container">
        //         {renderedTexts}
        //     </g>
        //     {
        //         clusterLabelTexts.map((texts, idx) => {
        //             const isCurrent = this.state.toExchange !== null && idx === this.state.toExchange.clusterID
        //             return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 0 : 1} visibility={this.state.toExchange === null ? "hidden" : "none"} onClick={() => onEdit("exchange", this.state.toExchange, idx)}>
        //                 <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={horizon} width={this.config.CellWidth*2} height={_height-horizon} fill={backgroundSelectionColors[idx]}/>
        //                 <rect className="mrt-background-card" x={this.config.CellWidth*idx*2} y={_height} width={this.config.CellWidth*2} height={extendedHeight} fill={backgroundGradientSelectionColors[idx]}/>
        //                 <g className="mrt-background-text" style={{textDecoration: isCurrent ? "underline" : ""}} transform={`translate(${this.config.CellWidth*idx*2+this.config.CellOrbmentOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSelectionColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
        //             </g>
        //         })
        //     }
        //     {
        //         <g opacity="0.5" transform={`translate(${_width}, ${_height+extendedHeight-this.labelTextLineHeight * 0.5})`}>                    
        //             <Logo x={-this.labelTextFontSize * 3.35} y={-this.labelTextFontSize * 1.78} height={this.labelTextFontSize * 0.8} width={this.labelTextFontSize * 0.8}/>
        //             <text x={-this.labelTextFontSize * 0.1} y={-this.labelTextFontSize * 0.05} textAnchor="end"
        //                 fontSize={this.labelTextFontSize * 0.75} fill={chroma("grey").luminance(0.3).hex()}>{(this.props.authors || []).join(', ')}
        //             </text>
        //             <text x={-this.labelTextFontSize * 0.1} y={-this.labelTextFontSize * 1} textAnchor="end"
        //                 fontSize={this.labelTextFontSize * 0.7} fill={chroma("grey").luminance(0.3).hex()}>AMiner
        //             </text>
        //         </g>
        //     }
        // </svg>
    }
}
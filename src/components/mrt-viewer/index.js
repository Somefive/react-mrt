import React from 'react'
import { NodeCircle, NodeText } from './node'
import randomstring from 'randomstring'
import chroma from 'chroma-js'
import _ from 'lodash'
import './index.css'
import { ReactComponent as Logo } from '../logo.svg'
import DefaultConfig from './default-config.json'
import * as d3plus from 'd3plus-text'
import adapter from './data-adapter'
import { CalculateEras } from './utils'

export default class MRTViewer extends React.Component {

    constructor(props) {
        super(props)

        this.labelTextFontSize = 64
        this.labelTextLineHeight = 72

        this.nodeFullSpan = 2

        this.nodeEditButtonMarginTop = 10

        this.state = {toExchange: null, focusEraIndex: -1}
    }

    onEditChange(edits) {
        if (this.props.onEditChange) this.props.onEditChange(edits)
    }

    render() {

        const tBegin = window.performance.now()
        
        this.config = {...DefaultConfig, ...this.props.config}
        this.config.CellOrbmentOffsetX = this.config.CellPaddingLeft + this.config.CellOrbmentRadius
        this.config.CellOrbmentOffsetY = this.config.CellPaddingTop + this.config.CellOrbmentRadius
        this.config.CellTextOffsetX = this.config.CellOrbmentOffsetX + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
        this.config.CellTextOffsetY = this.config.CellOrbmentOffsetY
        this.config.CellWidth = this.config.CellTextOffsetX + this.config.CellTextWidth + this.config.CellPaddingRight
        this.config.CellTextExpandWidth = this.config.CellTextWidth + this.config.CellWidth

        const narrow_wrap = d3plus.textWrap()
            .fontSize(this.config.CellTextFontSize)
            .lineHeight(this.config.CellTextLineHeight)
            .fontWeight(this.config.CellTextFontWeight)
            .width(this.config.CellTextWidth)
        const wide_wrap = d3plus.textWrap()
            .fontSize(this.config.CellTextFontSize)
            .lineHeight(this.config.CellTextLineHeight)
            .fontWeight(this.config.CellTextFontWeight)
            .width(this.config.CellTextExpandWidth)
        const narrow_secondary_wrap = d3plus.textWrap()
            .fontSize(this.config.CellTextSecondaryFontSize)
            .lineHeight(this.config.CellTextSecondaryLineHeight)
            .fontWeight(this.config.CellTextSecondaryFontWeight)
            .width(this.config.CellTextWidth)
        const wide_secondary_wrap = d3plus.textWrap()
            .fontSize(this.config.CellTextSecondaryFontSize)
            .lineHeight(this.config.CellTextSecondaryLineHeight)
            .fontWeight(this.config.CellTextSecondaryFontWeight)
            .width(this.config.CellTextExpandWidth)

        this.nodeTextLines = (node) => node.pins.reduce((prev, pin) => prev + pin.textPieces.length, 0)
        this.nodeHeight = (lines) => this.config.CellPaddingTop + this.config.CellOrbmentRadius + Math.max(this.config.CellOrbmentRadius, (lines-1) * this.config.CellTextLineHeight) + this.config.CellPaddingBottom

        this.nodeTextFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextSecondaryFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.config.CellWidth + this.config.CellTextWidth) / (this.config.CellTextSecondaryFontSize * 0.6))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }

        const papers = {}
        const root = adapter(this.props.data.root)
        this.props.data.branches.forEach((cluster, clusterID) => 
            cluster.forEach((branch, idx) => {
                if (this.props.hideSubBranch && idx > 0) return
                branch.forEach(raw => {
                    const paper = adapter(raw)
                    paper.isSub = idx > 0
                    paper.edits = this.props.userEdits[paper.id]
                    paper.clusterID = paper.edits ? paper.edits.clusterID : clusterID
                    paper.branchID = clusterID * 2 + paper.isSub
                    papers[paper.id] = paper
                })
            }
        ))
        const branches = _.flatten(this.props.data.branches).map(() => [])
        const years = Object.values(papers).map(paper => {
            branches[paper.branchID].push(paper)
            return paper.year
        })
        // calculate eras according to density of paper
        const eras = CalculateEras(years, this.config.EraMinRatio, this.config.LastEraRatio)
        const clusterNames = this.props.data.clusterNames.map(name => name.split(' ').map(_.capitalize).join(' '))
        const grid = eras.map(era => branches.map(branch => 
            branch.filter(paper => paper.year >= era.from && paper.year <= era.to)
                .sort((a, b) => (a.year === b.year) ? (b.citations - a.citations) : (b.year - a.year))
            ))
        console.log(eras, branches, papers, clusterNames, grid)

        this.hideSubBranch = this.props.hideSubBranch
        this.disableTextBranchSpan = this.props.disableTextBranchSpan
        this.disableTextClusterSpan = this.props.disableTextClusterSpan

        this.nodeFontExtraSize = this.props.fontExtraSize || 0

        // initialize views
        let numBranches = branches.length
        let numClusters = Math.floor(numBranches / 2)
        const rootColor = chroma.scale()(0.5)
        const clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(numClusters)
        const branchColors = branches.map((_, branchID) => chroma(clusterColors[Math.floor(branchID / 2)]).luminance(branchID % 2 === 0 ? 0.25 : 0.5))
        
        let views = {defs: [], nodes: {}, edges: []}
        const addEdge = (x1, y1, x2, y2, color) => views.edges.push(<line key={views.edges.length} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={this.config.CellStrokeWidth - 1} stroke={color}/>)
        const addVerticalEdge = (x, y1, y2, color) => addEdge(x, y1, x, y2, color)
        const addHorizontalEdge = (x1, x2, y, color) => addEdge(x1, y, x2, y, color)
        const generateGradientColor = (from, to, x1, y1, x2, y2) => {
            const colorID = randomstring.generate(8)
            views.defs.push(
                <defs key={colorID}>
                    <linearGradient id={colorID} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                    <stop offset="20%"  stopColor={from} />
                    <stop offset="80%" stopColor={to} />
                    </linearGradient>
                </defs>
            )
            return `url('#${colorID}')`
        }

        // Arrange coornidates for each era node
        views.nodes.root = {
            x: this.config.CellWidth * (branches.length - 1) / 2 + this.config.CellOrbmentOffsetX,
            y: this.config.CellOrbmentOffsetY,
            color: rootColor,
            pins: [{...root, 
                textPieces: this.nodeTextFold(root.text, 2), 
                fullTextPieces: this.nodeTextFold(root.text, 2),
                abstractPieces: this.nodeTextSecondaryFold(root.abstract, 2),

                // textPieces: wide_wrap(root.text).lines, 
                // fullTextPieces: wide_wrap(root.text).lines,
                // abstractPieces: wide_secondary_wrap(root.abstract).lines,
                edits: this.props.userEdits[root.id]
            }],
            span: 2,
            fullSpan: this.nodeFullSpan,
        }
        views.nodes.root.lines = this.nodeTextLines(views.nodes.root)
        views.nodes.root.height = this.nodeHeight(views.nodes.root.lines)

        views.nodes.branches = branches.map((branch, branchID) => eras.map((era, eraID) => { return {
            x: this.config.CellWidth * branchID + this.config.CellOrbmentOffsetX,
            y: 0,
            color: branchColors[branchID],
            pins: grid[eraID][branchID],
            era,
            eraID,
            clusterID: Math.floor(branchID / 2),
            branchID,
        }}))
        
        views.nodes.branches.forEach((branch, branchID) => branch.forEach((node, eraID) => {
            if (node.pins.length === 0) return
            node.span = (branchID < numBranches - 1 && views.nodes.branches[branchID+1][eraID].pins.length === 0
                && !this.disableTextBranchSpan && (!this.disableTextClusterSpan || branchID % 2 === 0)) ? 2 : 1
            node.fullSpan = (branchID < numBranches - 1) ? this.nodeFullSpan : 1
            node.pins.forEach(pin => {
                pin.textPieces = this.nodeTextFold(pin.text, node.span)
                pin.fullTextPieces = this.nodeTextFold(pin.text, node.fullSpan)
                pin.abstractPieces = this.nodeTextSecondaryFold(pin.abstract, node.fullSpan)

                // pin.textPieces = (node.span > 1 ? wide_wrap : narrow_wrap)(pin.text).lines
                // pin.fullTextPieces = (node.fullSpan > 1 ? wide_wrap : narrow_wrap)(pin.text).lines
                // pin.abstractPieces = (node.fullSpan > 1 ? wide_secondary_wrap : narrow_secondary_wrap)(pin.abstract).lines
            })
            node.lines = this.nodeTextLines(node)
            node.height = this.nodeHeight(node.lines)
        }))

        const horizon = views.nodes.root.height + this.config.HorizonMarginTop
        let _height = horizon + this.config.HorizonMarginBottom
        const erasHeight = eras.map((_, eraID) => {
            views.nodes.branches.forEach(branch => branch[eraID].y = _height + this.config.CellOrbmentOffsetY)
            const eraHeight = views.nodes.branches.reduce((prev, branch) => Math.max(prev, branch[eraID].height || 0), 0)
            _height += eraHeight
            return eraHeight
        })

        {
            const node = views.nodes.root, nodeLeft = views.nodes.branches[0][0], nodeRight = views.nodes.branches[numBranches - 2][0]
            addVerticalEdge(node.x, node.y, horizon, rootColor)
            addHorizontalEdge(nodeLeft.x, nodeRight.x, horizon, rootColor)
        }
        views.nodes.branches.forEach((branch, branchID) => {
            const _branch = branch.filter(node => node.pins.length > 0)
            if (_branch.length === 0 && branchID % 2 === 1) return
            const startEra = (branchID % 2 === 0) ? 0 : _branch[0].eraID
            let endEra = (_branch.length > 0) ? _branch[_branch.length-1].eraID : 0
            if (branchID % 2 === 0) {
                const _nextBranch = views.nodes.branches[branchID+1].filter(node => node.pins.length > 0)
                if (_nextBranch.length > 0) endEra = Math.max(endEra, _nextBranch[0].eraID)
            }
            const shrinkFlag = !this.disableTextBranchSpan && (!(this.disableTextClusterSpan && branchID % 2 === 0))
            for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
                let node = branch[eraID]
                let sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID] : null
                const yStart = (shrinkFlag && node.pins.length === 0 && ((branchID > 0 && sib.pins.length > 0) || (eraID === endEra))) ? (node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : node.y
                node = branch[eraID-1]
                sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID-1] : null
                const yEnd = (shrinkFlag && node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.config.CellOrbmentOffsetY + this.nodeHeight(this.nodeTextLines(sib)) - this.config.CellPaddingBottom + this.config.CellTextLineHeight) : node.y
                addVerticalEdge(node.x, yStart, yEnd, node.color)
            }
            if (branchID % 2 === 0) {
                const node = branch[0]
                const sib = branchID > 0 ? views.nodes.branches[branchID-1][0] : null
                const yEnd = (shrinkFlag && node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) : node.y
                addVerticalEdge(node.x, horizon, yEnd, generateGradientColor(rootColor, node.color, node.x, horizon, node.x, yEnd))
            } else {
                const node = branch[startEra]
                const sib = views.nodes.branches[branchID-1][startEra]
                const yEnd = node.y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight
                const yStart = node.y
                addVerticalEdge(node.x, yStart, yEnd, node.color)
                addHorizontalEdge(node.x, sib.x, yEnd, generateGradientColor(node.color, sib.color, node.x, yEnd, sib.x, yEnd))
            }
        })
        
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

        const extendedBottomY = views.nodes.branches.map(branch => branch[branch.length-1]).reduce((prev, node) => {
            let centerY = node.y
            node.pins.forEach(pin => {
                prev = Math.max(prev, centerY + (pin.fullTextPieces.length - 1) * this.config.CellTextLineHeight * 2 + pin.abstractPieces.length * this.config.CellTextSecondaryLineHeight + this.config.CellTextLineHeight * 2)
                centerY += pin.textPieces.length * this.config.CellTextLineHeight
            })
            return prev
        }, _height)

        const renderNodes = _.flattenDeep(views.nodes.branches).sort((a, b) => (a.eraID === b.eraID) ? (b.branchID - a.branchID) : (b.eraID - a.eraID))
        renderNodes.push(views.nodes.root)

        const _width = this.config.CellWidth * branches.length
        const clusterLabelTextPieces = clusterNames.map(name => name.split(' '))
        const clusterLabelTexts = clusterLabelTextPieces.map((pieces, _idx) => 
            <text key={_idx}>
                {pieces.reverse().map((_text, idx) => <tspan key={idx} x="0" y={-idx * this.labelTextLineHeight}>{_text}</tspan>)}
            </text>
        )
        const clusterLabelsHeight = clusterLabelTextPieces.reduce((prev, pieces) => Math.max(prev, pieces.length), 0) * this.labelTextLineHeight
        _height += clusterLabelsHeight + this.labelTextLineHeight

        const extendedHeight = Math.max(this.labelTextLineHeight * 1.5, extendedBottomY - _height)
        const backgroundSolidColors = clusterColors.map(color => chroma(color).luminance(0.9))
        const backgroundTextSolidColors = clusterColors.map(color => chroma(color).luminance(0.7))
        const backgroundGradientSolidColors = clusterColors.map((color, idx) => {
            const x = views.nodes.branches[idx*2][eras.length-1].x
            return generateGradientColor(chroma(color).luminance(0.9), "white", x, _height, x, _height+extendedHeight)
        })
        const backgroundSelectionColors = clusterColors.map(color => chroma(color).luminance(0.5))
        const backgroundTextSelectionColors = clusterColors.map(color => chroma(color).luminance(0.2))
        const backgroundGradientSelectionColors = clusterColors.map((color, idx) => {
            const x = views.nodes.branches[idx*2][eras.length-1].x
            return generateGradientColor(chroma(color).luminance(0.5), "white", x, _height, x, _height+extendedHeight)
        })

        console.log("calculation time:", window.performance.now() - tBegin)

        return <svg className="mrt" id={this.props.id} width="100%" viewBox={`0 0 ${_width} ${_height+extendedHeight}`}>
            {views.defs}
            <filter id="blur-filter">
                <feGaussianBlur stdDeviation={this.config.CellTextLineHeight} in="SourceGraphic"/>
            </filter>
            {
                <g className="mrt-background">
                    <rect x="0" y="0" width={_width} height={horizon} fill={chroma(rootColor).luminance(0.9)}></rect>
                </g>
            }
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
                eras.map((era, idx) => 
                <g key={idx} className="mrt-era-background" transform={`translate(0, ${views.nodes.branches[0][idx].y - this.config.CellOrbmentRadius - this.config.CellPaddingTop + erasHeight[idx]})`}>
                    <rect className="mrt-era-background" x="0" y={-erasHeight[idx]} width={_width} height={erasHeight[idx]} opacity={(idx === this.state.focusEraIndex) ? 0.1 : 0}/>
                    <text className="mrt-era-background" fontSize={this.labelTextFontSize} x={this.config.CellPaddingLeft} y={-this.labelTextFontSize/2} opacity={(idx === this.state.focusEraIndex) ? 0.2 : 0}>
                        {era.from === era.to ? era.from : `${era.from} - ${era.to}`}
                    </text>
                </g>)
            }
            {renderNodes.map((node, idx) => node.pins.length > 0 &&
                <NodeCircle key={idx} node={node}
                            radius={this.config.CellOrbmentRadius}
                            lineHeight={this.config.CellTextLineHeight}
                            color={node.color}
                            strokeWidth={this.config.CellStrokeWidth}
                            onHover={(hover) => 
                                this.setState({...this.state,
                                    focusEraIndex: hover ? node.eraID : -1
                                })   
                            }/>
            )}
            {
                views.nodes.branches.map((branch, idx) => {
                    if (idx % 2 !== 0) return <text key={idx}/>
                    const _branch = branch.filter(node => node.pins.length > 0)
                    const _sibBranch = views.nodes.branches[idx+1].filter(node => node.pins.length > 0)
                    if (_branch.length === 0 && _sibBranch.length === 0) return <text key={idx}/>
                    const fontSize = this.config.CellTextFontSize * 2
                    const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
                        (_sibBranch[0].y - this.config.CellOrbmentRadius - this.config.CellTextLineHeight) :
                        (_branch[0].y - this.config.CellTextLineHeight)) - fontSize / 2
                    const x = branch[0].x + this.config.CellOrbmentRadius + this.config.CellTextLeadMargin
                    const color = chroma(branchColors[idx]).darken(2)
                    return <text key={idx} x={x} y={y} fill={color} fontSize={fontSize}>{clusterNames[Math.floor(idx / 2)]}</text>
                })
            }
            {views.edges}
            <g className="mrt-node-text-container">
            {renderNodes.map((node, idx) => node.pins.length > 0 &&
                <NodeText key={idx}
                      pins={node.pins} 
                      x={node.x} y={node.y}
                      radius={this.config.CellOrbmentRadius}
                      lineHeight={this.config.CellTextLineHeight}
                      secondaryLineHeight={this.config.CellTextSecondaryLineHeight}
                      textWidth={(node.span - 1) * this.config.CellWidth + this.config.CellTextWidth}
                      fullTextWidth={(node.fullSpan - 1) * this.config.CellWidth + this.config.CellTextWidth}
                      color={node.color}
                      fontSize={this.config.CellTextFontSize}
                      secondaryFontSize={this.config.CellTextSecondaryFontSize}
                      strokeWidth={this.config.CellStrokeWidth}
                      onEdit={onEdit}
                      textLeadingMargin={this.config.CellTextLeadMargin}
                      editable={typeof(node.clusterID) !== "undefined"}
                      editButtonMarginTop={this.nodeEditButtonMarginTop}
                      scaleOrigin={(node.clusterID === numClusters - 1) ? "right" : ((node.branchID === numBranches - 3) ? "middle" : "left")}/>)}
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
            }
        </svg>
    }
}
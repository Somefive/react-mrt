import React from 'react'
import { NodeCircle, NodeText } from './node'
import randomstring from 'randomstring'
import chroma from 'chroma-js'
import lodash from 'lodash'
import './index.css'

export default class MRT extends React.Component {

    constructor(props) {
        super(props)

        this.disableTextBranchSpan = this.props.disableTextBranchSpan
        this.disableTextClusterSpan = this.props.disableTextClusterSpan

        this.hideSubBranch = this.props.hideSubBranch

        this.EraMinRatio = this.props.EraMinRatio || 0.05
        this.lastEraRatio = this.props.lastEraRatio || 0.2

        this.strokeWidth = 4

        this.labelTextFontSize = 64
        this.labelTextLineHeight = 72

        this.nodeRadius = 20
        this.nodeTextLeadingMargin = 20
        this.nodeTextWidth = 260
        this.nodeTextFontSize = 18
        this.nodeTextSecondaryFontSize = 16
        this.nodeTextLineHeight = 20
        this.nodeTextSecondaryLineHeight = 18

        this.nodeFullSpan = 2

        this.horizonMarginTop = 32
        this.horizonMarginBottom = 48

        this.averageFontWidthRatio = 0.6
        
        this.nodePaddingLeft = 20
        this.nodePaddingRight = 20
        this.nodePaddingTop = 32
        this.nodePaddingBottom = 12

        this.nodeEditButtonMarginTop = 10

        this.nodeOffsetX = this.nodePaddingLeft + this.nodeRadius
        this.nodeOffsetY = this.nodePaddingTop + this.nodeRadius
        
        this.nodeWidth = this.nodePaddingLeft + 2 * this.nodeRadius + this.nodeTextLeadingMargin + this.nodeTextWidth + this.nodePaddingRight
        this.nodeTextLines = (node) => node.pins.reduce((prev, pin) => prev + pin.textPieces.length, 0)
        this.nodeHeight = (lines) => this.nodePaddingTop + this.nodeRadius + Math.max(this.nodeRadius, (lines-1) * this.nodeTextLineHeight) + this.nodePaddingBottom
        this.nodeTextFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.nodeWidth + this.nodeTextWidth) / (this.nodeTextFontSize * this.averageFontWidthRatio))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }
        this.nodeTextSecondaryFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.nodeWidth + this.nodeTextWidth) / (this.nodeTextSecondaryFontSize * this.averageFontWidthRatio))
            return (text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g')) || []).filter(line => line.length > 0)
        }

        this._data = props.data

        const extract = (paper) => {
            const id = paper["paper_id"]
            const year = paper["paper_year"]
            const venue = paper["paper_venue"].trim()
            const title = paper["paper_title"].trim()
            const citations = paper["paper_citations"]
            let prefix = `${year}`
            const venue_year = /^(19|20)\d{2}\b/.exec(venue)
            if (venue_year == null && venue.length > 0) {
                prefix = `${year} ${venue}`
            } else if (venue_year != null) {
                prefix = `${venue}`
            }
            const text = `[${prefix}] ${title}`.replace('\t', ' ').replace('\n', ' ')
            const abstract = paper["paper_abstract"] ? paper["paper_abstract"].trim().replace('\t', ' ') : ""
            return {id, year, venue, title, citations, text, abstract}
        }
        this.data = {
            root: extract(this._data.root),
            branches: []
        }
        this._data.branches.forEach(branch => {
            this.data.branches.push(branch[0].map(extract))
            this.data.branches.push(branch[1].map(extract))
        })
        this.data.branches.forEach(branch => branch.sort((a, b) => {
            return a.year === b.year ? (b.citations - a.citations) : (b.year - a.year)
        }))
        this.clusterNames = this.props.data.clusterNames.map(name => name.split(' ').map(lodash.capitalize).join(' '))

        this.state = {userEdits: {}, toExchange: null, focusNodeIndex: -1}
    }

    setFocusNodeIndex(idx) {
        this.setState({...this.state, focusNodeIndex: idx})
    }
    
    render() {

        // initialize dataView (filter subBranch is hideSubBranch is enabled)
        let dataView = {root: {...this.data.root}, branches: this.data.branches.map(() => [])}
        this.data.branches.forEach((branch, idx) => branch.forEach(paper => {
            const isSub = idx % 2 === 1
            const edits = this.state.userEdits[paper.id]
            const clusterID = edits ? edits.clusterID : Math.floor(idx / 2)
            const branchID = clusterID * 2 + isSub
            if (!this.hideSubBranch || !isSub) dataView.branches[branchID].push({...paper, isSub, edits, clusterID, branchID})
        }))
        dataView.branches.forEach(branch => branch.sort((a, b) => (a.year === b.year) ? (b.citations - a.citations) : (b.year - a.year)))

        // calculate eras according to density of paper
        let eras = []
        {
            let years = dataView.branches.flat().map(paper => paper.year).sort().reverse()
            let _to = years[0]
            let _cnt = 1
            let eraMinSize = this.EraMinRatio * years.length
            let lastEraMinSize = this.lastEraRatio * years.length
            for (let i = 1; i < years.length; i++) {
                if (years[i] === years[i-1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) _cnt += 1
                else {
                    eras.push({from: years[i-1], to: _to, cnt: _cnt})
                    _to = years[i]
                    _cnt = 1
                }
            }
            eras.push({from: years[years.length-1], to: _to, cnt: _cnt})
        }
        const branchWithEra = (branch, era) => branch.filter(paper => paper.year >= era.from && paper.year <= era.to)

        // initialize views
        let numBranches = dataView.branches.length
        let numClusters = Math.floor(numBranches / 2)
        const rootColor = chroma.scale()(0.5)
        const clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(numClusters)
        const branchColors = dataView.branches.map((_, branchID) => chroma(clusterColors[Math.floor(branchID / 2)]).luminance(branchID % 2 === 0 ? 0.25 : 0.5))
        let views = {defs: [], nodes: {}, edges: []}
        const addEdge = (x1, y1, x2, y2, color) => views.edges.push(<line key={views.edges.length} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={this.strokeWidth - 1} stroke={color}/>)
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
            x: this.nodeWidth * (dataView.branches.length - 1) / 2 + this.nodeOffsetX,
            y: this.nodeOffsetY,
            color: rootColor,
            pins: [{...dataView.root, 
                textPieces: this.nodeTextFold(dataView.root.text, 2), 
                fullTextPieces: this.nodeTextFold(dataView.root.text, this.nodeFullSpan),
                abstractPieces: this.nodeTextSecondaryFold(dataView.root.abstract, this.nodeFullSpan),
                edits: this.state.userEdits[dataView.root.id]
            }],
            span: 2,
            fullSpan: this.nodeFullSpan,
        }
        views.nodes.root.lines = this.nodeTextLines(views.nodes.root)
        views.nodes.root.height = this.nodeHeight(views.nodes.root.lines)

        views.nodes.branches = dataView.branches.map((branch, branchID) => eras.map((era, eraID) => { return {
            x: this.nodeWidth * branchID + this.nodeOffsetX,
            y: 0,
            color: branchColors[branchID],
            pins: branchWithEra(branch, era),
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
            })
            node.lines = this.nodeTextLines(node)
            node.height = this.nodeHeight(node.lines)
        }))

        const horizon = views.nodes.root.height + this.horizonMarginTop
        let _height = horizon + this.horizonMarginBottom
        eras.forEach((_, eraID) => {
            views.nodes.branches.forEach(branch => branch[eraID].y = _height + this.nodeOffsetY)
            _height += views.nodes.branches.reduce((prev, branch) => Math.max(prev, branch[eraID].height || 0), 0)
        })

        {
            const node = views.nodes.root, nodeLeft = views.nodes.branches[0][0], nodeRight = views.nodes.branches[numBranches - 2][0]
            addVerticalEdge(node.x, node.y, horizon, rootColor)
            addHorizontalEdge(nodeLeft.x, nodeRight.x, horizon, rootColor)
        }
        {
            views.nodes.branches.forEach((branch, branchID) => {
                const _branch = branch.filter(node => node.pins.length > 0)
                if (_branch.length === 0 && branchID % 2 === 1) return
                const startEra = (branchID % 2 === 0) ? 0 : _branch[0].eraID
                let endEra = (_branch.length > 0) ? _branch[_branch.length-1].eraID : 0
                if (branchID % 2 === 0) {
                    const _nextBranch = views.nodes.branches[branchID+1].filter(node => node.pins.length > 0)
                    if (_nextBranch.length > 0) endEra = Math.max(endEra, _nextBranch[0].eraID)
                }
                for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
                    let node = branch[eraID]
                    let sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID] : null
                    const yStart = (node.pins.length === 0 && ((branchID > 0 && sib.pins.length > 0) || (eraID === endEra))) ? (node.y - this.nodeRadius - this.nodeTextLineHeight) : node.y
                    node = branch[eraID-1]
                    sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID-1] : null
                    const yEnd = (node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.nodeOffsetY + this.nodeHeight(this.nodeTextLines(sib)) - this.nodePaddingBottom + this.nodeTextLineHeight) : node.y
                    addVerticalEdge(node.x, yStart, yEnd, node.color)
                }
                if (branchID % 2 === 0) {
                    const node = branch[0]
                    const sib = branchID > 0 ? views.nodes.branches[branchID-1][0] : null
                    const yEnd = (node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.nodeRadius - this.nodeTextLineHeight) : node.y
                    addVerticalEdge(node.x, horizon, yEnd, generateGradientColor(rootColor, node.color, node.x, horizon, node.x, yEnd))
                } else {
                    const node = branch[startEra]
                    const sib = views.nodes.branches[branchID-1][startEra]
                    const yEnd = node.y - this.nodeRadius - this.nodeTextLineHeight
                    const yStart = node.y
                    addVerticalEdge(node.x, yStart, yEnd, node.color)
                    addHorizontalEdge(node.x, sib.x, yEnd, generateGradientColor(node.color, sib.color, node.x, yEnd, sib.x, yEnd))
                }
            })
        }
        
        const onEdit = (action, source, param) => {
            const _state = {...this.state}
            if (!_state.userEdits[source.id] && (action === "thumb-up" || action === "thumb-down" || action === "exchange")) {
                _state.userEdits[source.id] = {rate: 0, clusterID: source.clusterID}
            }
            if (action === "thumb-up" && _state.userEdits[source.id].rate <= 0) {
                _state.userEdits[source.id].rate = 1
                this.setState(_state)
            } else if (action === "thumb-down" && _state.userEdits[source.id].rate >= 0) {
                _state.userEdits[source.id].rate = -1
                this.setState(_state)
            } else if (action === "thumb-delete" && _state.userEdits[source.id] && _state.userEdits[source.id].rate !== 0) {
                _state.userEdits[source.id].rate = 0
                this.setState(_state)
            } else if (action === "to-exchange" && _state.toExchange === null) {
                _state.toExchange = source
                this.setState(_state)
            } else if (action === "exchange") {
                _state.userEdits[source.id].clusterID = param
                _state.toExchange = null
                this.setState(_state)
            }
        }

        const extendedBottomY = views.nodes.branches.map(branch => branch[branch.length-1]).reduce((prev, node) => {
            let centerY = node.y
            node.pins.forEach(pin => {
                prev = Math.max(prev, centerY + (pin.fullTextPieces.length - 1) * this.nodeTextLineHeight * 2 + pin.abstractPieces.length * this.nodeTextSecondaryLineHeight + this.nodeTextLineHeight * 2)
                centerY += pin.textPieces.length * this.nodeTextLineHeight
            })
            return prev
        }, _height)

        const renderNodes = views.nodes.branches.flat(Infinity).sort((a, b) => (a.eraID === b.eraID) ? (b.branchID - a.branchID) : (b.eraID - a.eraID))
        renderNodes.push(views.nodes.root)

        const _width = this.nodeWidth * dataView.branches.length
        const clusterLabelTextPieces = this.clusterNames.map(name => name.split(' '))
        const clusterLabelTexts = clusterLabelTextPieces.map((pieces, _idx) => 
            <text key={_idx}>
                {pieces.reverse().map((_text, idx) => <tspan key={idx} x="0" y={-idx * this.labelTextLineHeight}>{_text}</tspan>)}
            </text>
        )
        const clusterLabelsHeight = clusterLabelTextPieces.reduce((prev, pieces) => Math.max(prev, pieces.length), 0) * this.labelTextLineHeight
        _height += clusterLabelsHeight + this.labelTextLineHeight

        const extendedHeight = Math.max(0, extendedBottomY - _height)
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

        return <svg className='mrt' /*width={`${_width}px`} height={`${_height}px`}*/ width="100%" viewBox={`0 0 ${_width} ${_height+extendedHeight}`}>
            {views.defs}
            <filter id="blur-filter">
                <feGaussianBlur stdDeviation={this.nodeTextLineHeight} in="SourceGraphic"/>
            </filter>
            {
                <g className="mrt-background">
                    <rect x="0" y="0" width={_width} height={horizon} fill={chroma(rootColor).luminance(0.9)}></rect>
                </g>
            }
            {
                clusterLabelTexts.map((texts, idx) => {
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 1 : 0}>
                        <rect x={this.nodeWidth*idx*2} y={horizon} width={this.nodeWidth*2} height={_height-horizon} fill={backgroundSolidColors[idx]}/>
                        <rect x={this.nodeWidth*idx*2} y={_height} width={this.nodeWidth*2} height={extendedHeight} fill={backgroundGradientSolidColors[idx]}/>
                        <g transform={`translate(${this.nodeWidth*idx*2+this.nodeOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSolidColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
                    </g>
                })
            }
            {
                views.nodes.branches.map((branch, idx) => {
                    if (idx % 2 !== 0) return
                    const _branch = branch.filter(node => node.pins.length > 0)
                    const _sibBranch = views.nodes.branches[idx+1].filter(node => node.pins.length > 0)
                    if (_branch.length === 0 && _sibBranch.length === 0) return
                    const fontSize = this.nodeTextFontSize * 2
                    const y = ((_branch.length === 0 || (_sibBranch.length > 0 && _sibBranch[0].eraID <= _branch[0].eraID)) ?
                        (_sibBranch[0].y - this.nodeRadius - this.nodeTextLineHeight) :
                        (_branch[0].y - this.nodeTextLineHeight)) - fontSize / 2
                    const x = branch[0].x + this.nodeRadius + this.nodeTextLeadingMargin
                    const color = chroma(branchColors[idx]).darken(2)
                    return <text key={idx} x={x} y={y} fill={color} fontSize={fontSize}>{this.clusterNames[Math.floor(idx / 2)]}</text>
                })
            }
            {views.edges}
            {renderNodes.map((node, idx) => node.pins.length > 0 &&
                <NodeCircle key={idx} node={node}
                            radius={this.nodeRadius}
                            lineHeight={this.nodeTextLineHeight}
                            color={node.color}
                            strokeWidth={this.strokeWidth}
                            onHover={(hover) => this.setFocusNodeIndex(hover ? idx : -1)}
                            expand={idx === this.state.focusNodeIndex}/>
            )}
            <g className="mrt-node-text-container">
            {renderNodes.map((node, idx) => node.pins.length > 0 &&
                <NodeText key={idx}
                      pins={node.pins} 
                      x={node.x} y={node.y}
                      radius={this.nodeRadius}
                      lineHeight={this.nodeTextLineHeight}
                      secondaryLineHeight={this.nodeTextSecondaryLineHeight}
                      textWidth={(node.span - 1) * this.nodeWidth + this.nodeTextWidth}
                      fullTextWidth={(node.fullSpan - 1) * this.nodeWidth + this.nodeTextWidth}
                      color={node.color}
                      fontSize={this.nodeTextFontSize}
                      secondaryFontSize={this.nodeTextSecondaryFontSize}
                      strokeWidth={this.strokeWidth}
                      onEdit={onEdit}
                      textLeadingMargin={this.nodeTextLeadingMargin}
                      onHover={(hover) => this.setFocusNodeIndex(hover ? idx : -1)}
                      editable={typeof(node.clusterID) !== "undefined"}
                      editButtonMarginTop={this.nodeEditButtonMarginTop}
                      scaleOrigin={(node.clusterID === numClusters - 1) ? "right" : ((node.branchID === numBranches - 3) ? "middle" : "left")}/>)}
            </g>
            {
                clusterLabelTexts.map((texts, idx) => {
                    const isCurrent = this.state.toExchange !== null && idx === this.state.toExchange.clusterID
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 0 : 1} visibility={this.state.toExchange === null ? "hidden" : "none"} onClick={() => onEdit("exchange", this.state.toExchange, idx)}>
                        <rect className="mrt-background-card" x={this.nodeWidth*idx*2} y={horizon} width={this.nodeWidth*2} height={_height-horizon} fill={backgroundSelectionColors[idx]}/>
                        <rect className="mrt-background-card" x={this.nodeWidth*idx*2} y={_height} width={this.nodeWidth*2} height={extendedHeight} fill={backgroundGradientSelectionColors[idx]}/>
                        <g className="mrt-background-text" style={{textDecoration: isCurrent ? "underline" : ""}} transform={`translate(${this.nodeWidth*idx*2+this.nodeOffsetX}, ${_height-this.labelTextLineHeight/2})`} fill={backgroundTextSelectionColors[idx]} fontSize={this.labelTextFontSize}>{texts}</g>
                    </g>
                })
            }
        </svg>
    }
}
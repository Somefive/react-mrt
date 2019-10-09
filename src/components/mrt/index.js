import React from 'react'
import Node, { NodeCircle } from './node'
import randomstring from 'randomstring'
import chroma from 'chroma-js'
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

        this.nodeRadius = 20
        this.nodeTextLeadingMargin = 20
        this.nodeTextWidth = 260
        this.nodeTextFontSize = 16
        this.nodeTextLineHeight = 18

        this.horizonMarginTop = 32
        this.horizonMarginBottom = 32

        this.averageFontWidthRatio = 0.6
        
        this.nodePaddingLeft = 20
        this.nodePaddingRight = 20
        this.nodePaddingTop = 32
        this.nodePaddingBottom = 12

        this.nodeOffsetX = this.nodePaddingLeft + this.nodeRadius
        this.nodeOffsetY = this.nodePaddingTop + this.nodeRadius
        
        this.nodeWidth = this.nodePaddingLeft + 2 * this.nodeRadius + this.nodeTextLeadingMargin + this.nodeTextWidth + this.nodePaddingRight
        this.nodeTextLines = (node) => node.pins.reduce((prev, pin) => prev + pin.textPieces.length, 0)
        this.nodeHeight = (lines) => this.nodePaddingTop + this.nodeRadius + Math.max(this.nodeRadius, (lines-1) * this.nodeTextLineHeight) + this.nodePaddingBottom
        this.nodeTextFold = (text, span) => {
            const textLength = Math.floor(((span - 1) * this.nodeWidth + this.nodeTextWidth) / (this.nodeTextFontSize * this.averageFontWidthRatio))
            return text.match(new RegExp(`([^\\n]{1,${textLength}})(\\s|$)`, 'g'))
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
            return {id, year, venue, title, citations, text}
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
        this.clusterNames = this._data.branches.map((_, idx) => `Cluster ${idx}`)

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
        let views = {colorDefs: [], nodes: {}, edges: []}
        const addEdge = (x1, y1, x2, y2, color) => views.edges.push(<line key={views.edges.length} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={this.strokeWidth - 1} stroke={color}/>)
        const addVerticalEdge = (x, y1, y2, color) => addEdge(x, y1, x, y2, color)
        const addHorizontalEdge = (x1, x2, y, color) => addEdge(x1, y, x2, y, color)
        const generateGradientColor = (from, to, x1, y1, x2, y2) => {
            const colorID = randomstring.generate(8)
            views.colorDefs.push(
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
            pins: [{...dataView.root, textPieces: this.nodeTextFold(dataView.root.text, 2)}],
            span: 2,
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
            const span = (branchID < numBranches - 1 && views.nodes.branches[branchID+1][eraID].pins.length === 0
                && !this.disableTextBranchSpan && (!this.disableTextClusterSpan || branchID % 2 === 0)) ? 2 : 1
            node.pins.forEach(pin => pin.textPieces = this.nodeTextFold(pin.text, span))
            node.span = span
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

        _height += this.labelTextFontSize * 3
        
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

        const _width = this.nodeWidth * dataView.branches.length
        return <svg className='mrt' /*width={`${_width}px`} height={`${_height}px`}*/ width="100%" viewBox={`0 0 ${_width} ${_height}`}>
            {views.colorDefs}
            {
                <g className="mrt-background">
                    <rect x="0" y="0" width={_width} height={horizon} fill={chroma(rootColor).luminance(0.9)}></rect>
                </g>
            }
            {
                views.nodes.branches.map((branch, idx) => {
                    if (idx % 2 !== 0) return
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 1 : 0}>
                        <rect x={this.nodeWidth*idx} y={horizon} width={this.nodeWidth*2} height={_height-horizon} fill={chroma(branch[0].color).luminance(0.9)}></rect>
                        <text x={this.nodeWidth*idx+this.nodeOffsetX} y={_height - this.labelTextFontSize} fill={chroma(branch[0].color).luminance(0.7)} fontSize={this.labelTextFontSize}>{this.clusterNames[Math.floor(idx / 2)]}</text>
                    </g>
                })
            }
            {views.edges}
            {[views.nodes.root, ...views.nodes.branches.flat(Infinity)].map((node, idx) => node.pins.length > 0 &&
                <NodeCircle key={idx} node={node}
                            radius={this.nodeRadius}
                            lineHeight={this.nodeTextLineHeight}
                            color={node.color}
                            strokeWidth={this.strokeWidth}
                            onHover={(hover) => this.setFocusNodeIndex(hover ? idx : -1)}
                            expand={idx === this.state.focusNodeIndex}/>
            )}
            {[views.nodes.root, ...views.nodes.branches.flat(Infinity)].map((node, idx) => node.pins.length > 0 &&
                <Node key={idx}
                      pins={node.pins} 
                      x={node.x} y={node.y}
                      radius={this.nodeRadius}
                      lineHeight={this.nodeTextLineHeight}
                      color={node.color}
                      fontSize={this.nodeTextFontSize}
                      strokeWidth={this.strokeWidth}
                      onEdit={onEdit}
                      textLeadingMargin={this.nodeTextLeadingMargin}
                      onHover={(hover) => this.setFocusNodeIndex(hover ? idx : -1)}
                      editable={typeof(node.clusterID) !== "undefined"}/>)}
            {
                views.nodes.branches.map((branch, idx) => {
                    if (idx % 2 !== 0) return
                    const isCurrent = this.state.toExchange !== null && Math.floor(idx / 2) === this.state.toExchange.clusterID
                    return <g className="mrt-background" key={idx} opacity={this.state.toExchange === null ? 0 : 1} visibility={this.state.toExchange === null ? "hidden" : "none"} onClick={() => onEdit("exchange", this.state.toExchange, Math.floor(idx / 2))}>
                        <rect className="mrt-background-card" x={this.nodeWidth*idx} y={horizon} width={this.nodeWidth*2} height={_height-horizon} fill={chroma(branch[0].color).luminance(0.5)}></rect>
                        <text className="mrt-background-text" x={this.nodeWidth*idx+this.nodeOffsetX} y={_height - this.labelTextFontSize} fill={chroma(branch[0].color).luminance(0.2)} fontSize={this.labelTextFontSize * (isCurrent ? 1 : 0.5)}>{this.clusterNames[Math.floor(idx / 2)]}</text>
                    </g>
                })
            }
        </svg>
    }
}
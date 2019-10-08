import React from 'react'
import Node from './node'
import randomstring from 'randomstring'
import chroma from 'chroma-js'
import _ from 'lodash'

export default class MRT extends React.Component {

    constructor(props) {
        super(props)

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
    }
    
    render() {

        let views = {colorDefs: [], nodes: {}, edges: [], background: []}

        let dataView = _.cloneDeep(this.data)
        if (this.hideSubBranch) dataView.branches = dataView.branches.map((branch, idx) => idx % 2 === 0 ? branch : [])
        let numBranches = dataView.branches.length
        let numClusters = Math.floor(numBranches / 2)

        const rootColor = chroma.scale()(0.5)
        const colors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(numClusters)

        let eras = []
        {
            let years = dataView.branches.flat().map(paper => paper.year).sort((a, b) => (b - a))
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
        
        views.generateGradientColor = (from, to, x1, y1, x2, y2) => {
            const colorID = randomstring.generate(8)
            views.colorDefs.push(<defs key={colorID}>
                <linearGradient id={colorID} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                  <stop offset="20%"  stopColor={from} />
                  <stop offset="80%" stopColor={to} />
                </linearGradient>
              </defs>)
            return `url('#${colorID}')`
        }

        // Arrange coornidates for each era node
        views.nodes.root = {
            x: this.nodeWidth * (dataView.branches.length - 1) / 2 + this.nodeOffsetX,
            y: this.nodeOffsetY,
            color: rootColor,
            pins: [{
                citations: dataView.root.citations,
                text: dataView.root.text,
                textPieces: this.nodeTextFold(dataView.root.text, 2)
            }]
        }
        views.nodes.branches = dataView.branches.map((branch, branchID) => eras.map((era, eraID) => { return {
            x: this.nodeWidth * branchID + this.nodeOffsetX,
            y: 0,
            color: chroma(colors[Math.floor(branchID / 2)]).brighten(branchID % 2),
            pins: branch.filter(paper => paper.year >= era.from && paper.year <= era.to).map(paper => { return {
                citations: paper.citations,
                text: paper.text,
            }}),
            era: eraID,
        }}))
        
        views.nodes.branches.forEach((branch, branchID) => branch.forEach((node, eraID) => {
            if (node.pins.length === 0) return
            const span = (branchID < numBranches - 1 && views.nodes.branches[branchID+1][eraID].pins.length === 0) ? 2 : 1
            node.pins.forEach(pin => pin.textPieces = this.nodeTextFold(pin.text, span))
        }))

        let horizon = this.nodeHeight(this.nodeTextLines(views.nodes.root)) + this.nodePaddingTop
        let _height = horizon + this.nodePaddingBottom
        {
            eras.forEach((era, eraID) => {
                const maxLines = views.nodes.branches.reduce((prev, branch) => Math.max(prev, this.nodeTextLines(branch[eraID])), 0)
                views.nodes.branches.forEach(branch => branch[eraID].y = _height + this.nodeOffsetY)
                _height += this.nodeHeight(maxLines)
            })
        }

        {
            let node = views.nodes.root
            views.edges.push({x1: node.x, y1: node.y, x2: node.x, y2: horizon, color: rootColor})
            let nodeLeft = views.nodes.branches[0][0]
            let nodeRight = views.nodes.branches[numBranches - 2][0]
            views.edges.push({x1: nodeLeft.x, y1: horizon, x2: nodeRight.x, y2: horizon, color: rootColor})
        }
        {
            views.nodes.branches.forEach((branch, branchID) => {
                const _branch = branch.filter(node => node.pins.length > 0)
                if (_branch.length === 0) return
                const startEra = (branchID % 2 === 0) ? 0 : _branch[0].era
                let endEra = _branch[_branch.length-1].era
                if (branchID % 2 === 0) {
                    const _nextBranch = views.nodes.branches[branchID+1].filter(node => node.pins.length > 0)
                    if (_nextBranch.length > 0) {
                        endEra = Math.max(endEra, _nextBranch[0].era)
                    }
                }
                for (let eraID = startEra + 1; eraID <= endEra; eraID++) {
                    let node = branch[eraID]
                    let sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID] : null
                    const yStart = (node.pins.length === 0 && ((branchID > 0 && sib.pins.length > 0) || (eraID === endEra))) ? (node.y - this.nodeRadius - this.nodeTextLineHeight) : node.y
                    node = branch[eraID-1]
                    sib = branchID > 0 ? views.nodes.branches[branchID-1][eraID-1] : null
                    const yEnd = (node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.nodeOffsetY + this.nodeHeight(this.nodeTextLines(sib)) - this.nodePaddingBottom + this.nodeTextLineHeight) : node.y
                    views.edges.push({x1: node.x, y1: yStart, x2: node.x, y2: yEnd, color: node.color})
                }
                if (branchID % 2 === 0) {
                    const node = branch[0]
                    const sib = branchID > 0 ? views.nodes.branches[branchID-1][0] : null
                    const yEnd = (node.pins.length === 0 && branchID > 0 && sib.pins.length > 0) ? (node.y - this.nodeRadius - this.nodeTextLineHeight) : node.y
                    views.edges.push({x1: node.x, y1: horizon, x2: node.x, y2: yEnd, color: views.generateGradientColor(rootColor, node.color, node.x, horizon, node.x, yEnd)})
                } else {
                    const node = branch[startEra]
                    const sib = views.nodes.branches[branchID-1][startEra]
                    const yEnd = node.y - this.nodeRadius - this.nodeTextLineHeight
                    const yStart = node.y
                    views.edges.push({x1: node.x, y1: yStart, x2: node.x, y2: yEnd, color: node.color})
                    views.edges.push({x1: node.x, y1: yEnd, x2: sib.x, y2: yEnd, color: views.generateGradientColor(node.color, sib.color, node.x, yEnd, sib.x, yEnd)})
                }
            })
        }

        _height += this.labelTextFontSize * 3
        
        // For vertical background
        {
            views.nodes.branches.forEach((branch, idx) => {
                if (idx % 2 !== 0) return
                views.background.push(<g key={idx}>
                    <rect x={this.nodeWidth*idx} y="0" width={this.nodeWidth*2} height={_height} fill={chroma(branch[0].color).luminance(0.9)}></rect>
                    <text x={this.nodeWidth*idx+this.nodeOffsetX} y={_height - this.labelTextFontSize} fill={chroma(branch[0].color).luminance(0.7)} fontSize={this.labelTextFontSize}>Cluster {idx}</text>
                </g>)
            })
        }


        const _width = this.nodeWidth * dataView.branches.length
        return <svg className='mrt' width={`${_width}px`} height={`${_height}px`} /*width="100%"*/ viewBox={`0 0 ${_width} ${_height}`}>
            {views.colorDefs}
            {views.background}
            {views.edges.map((edge, idx) =>
                <line key={idx} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} strokeWidth={this.strokeWidth - 1} stroke={edge.color}/>
            )}
            {[views.nodes.root, ...views.nodes.branches.flat(Infinity)].map((node, idx) => node.pins.length > 0 &&
                <Node key={idx}
                      pins={node.pins} 
                      x={node.x} y={node.y}
                      radius={this.nodeRadius}
                      lineHeight={this.nodeTextLineHeight}
                      color={node.color}
                    //   citations={node.citations}
                      fontSize={this.nodeTextFontSize}
                      strokeWidth={this.strokeWidth}/>)}
        </svg>
    }
}
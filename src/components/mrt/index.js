import React from 'react'
import * as d3 from 'd3'
import Node from './node'
import { tsImportEqualsDeclaration } from '@babel/types'
import chroma from 'chroma-js'

export default class MRT extends React.Component {

    constructor(props) {
        super(props)

        this.branchWidth = 350
        this.yearMargin = 75

        this.strokeWidth = 3
        this.textWidth = 36
        this.radius = 18

        this.fontSize = this.radius - this.strokeWidth
        this.lineHeight = this.fontSize * 1.1
      
        this.nodesMap = {}
        const extract = (nodeData, parent) => {
            const id = nodeData["paper_id"]
            const year = nodeData["paper_year"]
            const venue = nodeData["paper_venue"].trim()
            const title = nodeData["paper_title"].trim()
            const citations = nodeData["paper_citations"]
            let prefix = `${year}`
            const venue_year = /^(19|20)\d{2}\b/.exec(venue)
            if (venue_year == null && venue.length > 0) {
                prefix = `${year} ${venue}`
            } else if (venue_year != null) {
                prefix = `${venue}`
            }
            const text = `[${prefix}] ${title}`.replace('\t', ' ').replace('\n', ' ')
            const _data = {parent, id, year, venue, title, citations, text, children: nodeData["children"].map(child => child["paper_id"])}
            this.nodesMap[id] = _data
            nodeData["children"].forEach(child => extract(child, id));
        }
        extract(props.data, "")
        this.root = this.nodesMap[props.data["paper_id"]]
    }
    
    render() {

        let nodes = []
        for (let id in this.nodesMap) nodes.push(this.nodesMap[id])

        let branches = this.root.children.map(() => [])
        const annotateBranchID = (id, branchID, subBranchID) => {
            let node = this.nodesMap[id]
            node.branchID = branchID
            node.subBranchID = subBranchID
            branches[branchID].push(node)
            node.children.forEach((child, idx) => annotateBranchID(child, branchID, subBranchID + idx))
        }
        this.root.branchID = -1
        this.root.subBranchID = 0
        this.root.children.forEach((child, idx) => annotateBranchID(child, idx, 0))

        const colors = chroma.cubehelix().start(200).rotations(-0.35).gamma(0.7).lightness([0.3, 0.7]).scale().correctLightness().colors(this.root.children.length)
        const annotateColor = (node) => { if (node.branchID >= 0) node.color = chroma(colors[node.branchID]).brighten(node.subBranchID) }
        this.root.color = "black"
        nodes.forEach(annotateColor)

        const annotateX = (node) => { if (node.branchID >= 0) node.x = (node.branchID + (node.subBranchID > 0) * 0.5) * this.branchWidth + this.radius * 2.5 }
        this.root.x = (this.root.children.length - 1) / 2 * this.branchWidth + this.radius * 2
        nodes.forEach(annotateX)
        
        const annotateTextPieces = (node, textWidth) => { node.textPieces = node.text.match(new RegExp(`([^\\n]{1,${textWidth}})(\\s|$)`, 'g')) }
        const annotateHeight = (node) => { node.height = this.radius * 0.5 + Math.max(this.lineHeight * node.textPieces.length, this.radius * 1.75) }
        
        annotateTextPieces(this.root, Math.floor(this.textWidth * (this.root.children.length - 1) / 2))
        annotateHeight(this.root, 1.5)

        this.root.y = 2 * this.radius
        let yearY = this.root.y + this.root.height + this.yearMargin * 2
        for (let year = this.root.year; year > 1900; year--) {
            let _branches = branches.map(branch => branch.filter(node => node.year == year))
            let nextYearY = yearY
            for (let i = 0; i < _branches.length; i++) {
                let _y = yearY
                let main = _branches[i].filter(node => node.subBranchID == 0)
                let sub = _branches[i].filter(node => node.subBranchID > 0)
                let factor = sub.length > 0 ? 0.4 : 1
                for (let j = 0; j < main.length; j++) {
                    annotateTextPieces(main[j], Math.floor(this.textWidth * factor))
                    annotateHeight(main[j])
                    main[j].y = _y
                    _y += main[j].height
                }
                let __y = yearY
                for (let j = 0; j < sub.length; j++) {
                    annotateTextPieces(sub[j], Math.floor(this.textWidth * factor))
                    annotateHeight(sub[j])
                    let _parent = this.nodesMap[sub[j].parent]
                    if (_parent.y + _parent.height > __y) __y = _parent.y + _parent.height
                    sub[j].y = __y
                    __y += sub[j].height
                }
                if (_y > nextYearY) nextYearY = _y
                if (__y > nextYearY) nextYearY = __y
            }
            if (nextYearY > yearY) nextYearY += this.yearMargin
            yearY = nextYearY
        }

        let baselineY = this.root.y + this.root.height
        let edges = [{x1: this.root.x, y1: baselineY, x2: this.root.x, y2: this.root.y, color: "black"}]
        let leftMostX = 0
        let rightMostX = 0
        for (let id in this.nodesMap) {
            const node = this.nodesMap[id]
            if (node.parent.length > 0) {
                const parentNode = this.nodesMap[node.parent]
                if (node.parent === this.root.id) {
                    edges.push({x1: node.x, y1: baselineY, x2: node.x, y2: node.y, color: node.color})
                    if (node.x < leftMostX || leftMostX == 0) leftMostX = node.x
                    if (node.x > rightMostX || rightMostX == 0) rightMostX = node.x
                } else {
                    edges.push({x1: parentNode.x, y1: parentNode.y, x2: node.x, y2: node.y, color: node.color})
                }
            }
        }
        edges.push({x1: leftMostX, y1: baselineY, x2: rightMostX, y2: baselineY, color: "black"})

        console.log(nodes, edges)

        const _width = this.branchWidth * this.root.children.length
        const _height = yearY
        return <svg className='mrt' /*width={`${_width}px`} height={`${_height}px`}*/ width="100%" viewBox={`0 0 ${_width} ${_height}`}>
            {edges.map((edge, idx) =>
                <line key={idx} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} strokeWidth={this.strokeWidth - 1} stroke={edge.color}/>
            )}
            {nodes.map((node) => 
                <Node key={node.id}
                      textPieces={node.textPieces} 
                      x={node.x} y={node.y}
                      radius={this.radius}
                      lineHeight={this.lineHeight}
                      color={node.color}
                      citations={node.citations}
                      fontSize={this.fontSize}
                      strokeWidth={this.strokeWidth}/>)}
        </svg>
    }
}
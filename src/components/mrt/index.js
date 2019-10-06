import React from 'react'
import * as d3 from 'd3'
import Node from './node'
import { tsImportEqualsDeclaration } from '@babel/types'
import chroma from 'chroma-js'

export default class MRT extends React.Component {

    constructor(props) {
        super(props)

        this.branchWidth = 300
        this.yearMargin = 40

        this.strokeWidth = 3
        this.textWidth = 30
        this.radius = 18

        this.fontSize = this.radius - this.strokeWidth
        this.lineHeight = this.fontSize
      
        this.nodesMap = {}
        const pattern = new RegExp(`([^\\n]{1,${this.textWidth}})(\\s|$)`, 'g')
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
            const textPieces = text.match(pattern)
            const _data = {parent, id, year, venue, title, citations, text, textPieces, children: nodeData["children"].map(child => child["paper_id"])}
            this.nodesMap[id] = _data
            nodeData["children"].forEach(child => extract(child, id));
        }
        extract(props.data, "")
        this.root = this.nodesMap[props.data["paper_id"]]

        this.branches = []
        const annotateBranchID = (id, branchID) => {
            this.nodesMap[id].branchID = branchID
            while (this.branches.length <= branchID) this.branches.push([])
            this.branches[branchID].push(id)
            let maxBranchID = branchID
            let nextBranchID = maxBranchID
            for (let i = 0; i < this.nodesMap[id].children.length; i++) {
                maxBranchID = annotateBranchID(this.nodesMap[id].children[i], nextBranchID)
                nextBranchID = maxBranchID + 1
            }
            return maxBranchID
        }
        this.numBranches = annotateBranchID(this.root.id, 0) + 1
        this.branches[0] = this.branches[0].slice(1)
        this.root.branchID = (this.numBranches - 1) / 2

        this.colors = chroma.cubehelix().start(200).rotations(-0.35).gamma(0.7).lightness([0.3, 0.7]).scale().correctLightness().colors(this.root.children.length)
        this.root.color = "black"
        const annotateColor = (id, color) => {
            let node = this.nodesMap[id]
            node.color = color
            if (node.children.length > 0) annotateColor(node.children[0], color)
            for (let i = 1; i < node.children.length; i++) annotateColor(node.children[i], chroma(color).brighten(i))
        }
        this.root.children.forEach((child, idx) => annotateColor(child, this.colors[idx]))
    }
    
    render() {
        
        const annotateHeight = (node) => { node.height = this.radius * 1.5 + this.lineHeight * node.textPieces.length }
        const annotateX = (node) => { node.x = node.branchID * this.branchWidth + this.radius * 2 }
        
        for (let id in this.nodesMap) {
            annotateHeight(this.nodesMap[id])
            annotateX(this.nodesMap[id])
        }

        this.root.y = 2 * this.radius

        let yearY = this.root.y + this.root.height + this.yearMargin * 2
        for (let year = this.root.year; year > 1900; year--) {
            let nextYearY = yearY
            for (let i = 0; i < this.numBranches; i++) {
                let _y = yearY
                for (let j = 0; j < this.branches[i].length; j++) {
                    let node = this.nodesMap[this.branches[i][j]]
                    if (node.year == year) {
                        if (node.parent.length > 0) {
                            let parentNode = this.nodesMap[node.parent]
                            if (parentNode.y + parentNode.height > _y) _y = parentNode.y + parentNode.height
                        }
                        node.y = _y
                        _y += node.height
                    }
                }
                if (_y > nextYearY) nextYearY = _y
            }
            if (nextYearY > yearY) nextYearY += this.yearMargin
            yearY = nextYearY
        }

        let nodes = []
        let baselineY = this.root.y + this.root.height
        let edges = [{x1: this.root.x, y1: baselineY, x2: this.root.x, y2: this.root.y, color: "black"}]
        let leftMostX = 0
        let rightMostX = 0
        for (let id in this.nodesMap) {
            const node = this.nodesMap[id]
            nodes.push(node)
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

        const _width = this.branchWidth * this.numBranches
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
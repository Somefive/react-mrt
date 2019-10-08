import React from 'react'
import Node from './node'
import randomstring from 'randomstring'
import chroma from 'chroma-js'

export default class MRT extends React.Component {

    constructor(props) {
        super(props)

        this.EraMinRatio = this.props.EraMinRatio || 0.05
        this.lastEraRatio = this.props.lastEraRatio || 0.2

        this.branchWidth = 400
        this.branchNodeXOffset = 50
        this.eraMargin = 60

        this.strokeWidth = 4
        this.textWidth = 36
        this.radius = 18

        this.fontSize = this.radius - this.strokeWidth
        this.lineHeight = this.fontSize * 1.1

        this.data = props.data
        this.data.branches.forEach(subBranches => subBranches.forEach(branch => branch.sort((a, b) => {
            return a.year === b.year ? (b.citations - a.citations) : (b.year - a.year)
        })))
        this.traverse = (rootCallback, branchCallback, branchNodeCallback) => {
            if (rootCallback) rootCallback(this.data.root)
            if (branchCallback || branchNodeCallback) this.data.branches.forEach((subBranches, branchID) => {
                subBranches.forEach((branch, subBranchID) => {
                    if (branchCallback) branchCallback(branch, branchID, subBranchID)
                    if (branchNodeCallback) branch.forEach((node) => branchNodeCallback(node, branchID, subBranchID))
                })
            })
        }
      
        const extract_annotator = (node) => {
            node.id = node["paper_id"]
            node.year = node["paper_year"]
            node.venue = node["paper_venue"].trim()
            node.title = node["paper_title"].trim()
            node.citations = node["paper_citations"]
            let prefix = `${node.year}`
            const venue_year = /^(19|20)\d{2}\b/.exec(node.venue)
            if (venue_year == null && node.venue.length > 0) {
                prefix = `${node.year} ${node.venue}`
            } else if (venue_year != null) {
                prefix = `${node.venue}`
            }
            node.text = `[${prefix}] ${node.title}`.replace('\t', ' ').replace('\n', ' ')
        }
        this.traverse(extract_annotator, null, extract_annotator)

        console.log(this.data)
    }
    
    render() {

        const rootColor = chroma.scale()(0.5)

        const colors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(this.data.branches.length)

        let years = []
        this.traverse(null, null, (node) => years.push(node.year))
        years.sort((a, b) => (b - a))
        let eras = []
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
        
        const matchTextPieces = (text, textWidth) => text.match(new RegExp(`([^\\n]{1,${textWidth}})(\\s|$)`, 'g'))
        const calculateHeight = (nodeView) => this.radius * 0.5 + Math.max(this.lineHeight * nodeView.pins.reduce((prev, pin) => prev + pin.textPieces.length, 0), this.radius * 1.75)

        let colorDefs = []
        const gradientColor = (from, to, x1, y1, x2, y2) => {
            const colorID = randomstring.generate(8)
            colorDefs.push(<defs key={colorID}>
                <linearGradient id={colorID} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                  <stop offset="20%"  stopColor={from} />
                  <stop offset="80%" stopColor={to} />
                </linearGradient>
              </defs>)
            return `url('#${colorID}')`
        }
        

        // Arrange coornidates for each era node
        let nodesView = {
            root: {
                x: this.branchWidth * (this.data.branches.length - 1) / 2 + this.branchNodeXOffset,
                y: this.eraMargin,
                color: rootColor,
                pins: [{
                    citations: this.data.root.citations,
                    textPieces: matchTextPieces(this.data.root.text, this.textWidth * Math.floor((this.data.branches.length - 1) / 2))
                }]
            },
            branches: this.data.branches.map(subBranches => subBranches.map(() => []))
        }
        let forkY = nodesView.root.y + calculateHeight(nodesView.root) + this.eraMargin
        let edgesView = [{
                x1: nodesView.root.x, y1: nodesView.root.y,
                x2: nodesView.root.x, y2: forkY,
                color: rootColor
            }
        ]
        let eraY = forkY + this.eraMargin
        for (let i = 0; i < eras.length; i++) {
            let maxHeight = 0
            let era = eras[i]
            let branches = this.data.branches.map(subBranches => subBranches.map(branch => branch.filter(node => node.year >= era.from && node.year <= era.to)))
            for (let branchID = 0; branchID < branches.length; branchID++) {
                let subBranches = branches[branchID]
                for (let subBranchID = 0; subBranchID < subBranches.length; subBranchID++) {
                    let branch = subBranches[subBranchID]
                    if (branch.length === 0) continue
                    const _textWidth = (subBranchID === 0 && subBranches[1].length === 0) ? this.textWidth : Math.floor(this.textWidth * 0.4)
                    const _nodeView = {
                        x: this.branchWidth * (branchID + (subBranchID > 0) * 0.5) + this.branchNodeXOffset,
                        y: eraY,
                        color: chroma(colors[branchID]).brighten(subBranchID),
                        pins: branch.map(node => { return {
                            citations: node.citations,
                            textPieces: matchTextPieces(node.text, _textWidth)
                        }})
                    }
                    if (nodesView.branches[branchID][subBranchID].length > 0) {
                        let parentNodeView = nodesView.branches[branchID][subBranchID][nodesView.branches[branchID][subBranchID].length - 1]
                        edgesView.push({x1: _nodeView.x, y1: _nodeView.y, x2: parentNodeView.x, y2: parentNodeView.y, color: _nodeView.color})
                    }
                    nodesView.branches[branchID][subBranchID].push(_nodeView)
                    maxHeight = Math.max(maxHeight, calculateHeight(_nodeView))
                }
            }
            eraY += maxHeight + this.eraMargin
        }
        
        nodesView.branches.forEach((subBranches, idx) => {
            let node = subBranches[0][0]
            edgesView.push({x1: node.x, y1: node.y, x2: node.x, y2: forkY, color: gradientColor(node.color, rootColor, node.x, node.y, node.x, forkY)})
            if (subBranches[1].length > 0) {
                let _node = subBranches[1][0]
                edgesView.push({x1: node.x, y1: subBranches[0][subBranches[0].length - 1].y, x2: node.x, y2: _node.y - this.eraMargin / 2, color: node.color})
                edgesView.push({x1: _node.x, y1: _node.y, x2: _node.x, y2: _node.y - this.eraMargin / 2, color: _node.color})
                edgesView.push({x1: node.x, y1: _node.y - this.eraMargin / 2, x2: _node.x, y2: _node.y - this.eraMargin / 2, color: gradientColor(node.color, _node.color, node.x, _node.y - this.eraMargin / 2, _node.x, _node.y - this.eraMargin / 2)})
            }
            if (idx > 0) {
                let _node = nodesView.branches[idx - 1][0][0]
                edgesView.push({x1: _node.x, y1: forkY, x2: node.x, y2: forkY, color: rootColor})
            }
        })

        console.log(nodesView)

        // let _yearBranches = []
        // for (let year = this.data.root.year; year >= years[0]; year--) {
        //     let branches = this.data.branches.map(subBranches => subBranches.map(branch => branch.filter(node => node.year == year)))
        //     let node_cnt = branches.reduce((prev, subBranches) => prev + subBranches.reduce((_prev, branch) => _prev + branch.length, 0), 0)
        //     if (node_cnt == 0) continue
        //     _yearBranches.push({"year": year, "count": node_cnt, "branches": branches})
        // }

        // let trailingYears = years[]

        // let nodes = []
        // for (let id in this.nodesMap) nodes.push(this.nodesMap[id])

        // let branches = this.root.children.map(() => [])
        // const annotateBranchID = (id, branchID, subBranchID) => {
        //     let node = this.nodesMap[id]
        //     node.branchID = branchID
        //     node.subBranchID = subBranchID
        //     branches[branchID].push(node)
        //     node.children.forEach((child, idx) => annotateBranchID(child, branchID, subBranchID + idx))
        // }
        // this.root.branchID = -1
        // this.root.subBranchID = 0
        // this.root.children.forEach((child, idx) => annotateBranchID(child, idx, 0))

        // const annotateX = (node) => { if (node.branchID >= 0) node.x = (node.branchID + (node.subBranchID > 0) * 0.5) * this.branchWidth + this.radius * 2.5 }
        // this.root.x = (this.root.children.length - 1) / 2 * this.branchWidth + this.radius * 2
        // nodes.forEach(annotateX)
        
        
        
        // annotateTextPieces(this.root, Math.floor(this.textWidth * (this.root.children.length - 1) / 2))
        // annotateHeight(this.root, 1.5)

        // this.root.y = 2 * this.radius
        // let yearY = this.root.y + this.root.height + this.yearMargin * 2
        // for (let year = this.root.year; year > 1900; year--) {
        //     let _branches = branches.map(branch => branch.filter(node => node.year == year))
        //     let nextYearY = yearY
        //     for (let i = 0; i < _branches.length; i++) {
        //         let _y = yearY
        //         let main = _branches[i].filter(node => node.subBranchID == 0)
        //         let sub = _branches[i].filter(node => node.subBranchID > 0)
        //         let factor = sub.length > 0 ? 0.4 : 1
        //         for (let j = 0; j < main.length; j++) {
        //             annotateTextPieces(main[j], Math.floor(this.textWidth * factor))
        //             annotateHeight(main[j])
        //             main[j].y = _y
        //             _y += main[j].height
        //         }
        //         let __y = yearY
        //         for (let j = 0; j < sub.length; j++) {
        //             annotateTextPieces(sub[j], Math.floor(this.textWidth * factor))
        //             annotateHeight(sub[j])
        //             let _parent = this.nodesMap[sub[j].parent]
        //             if (_parent.y + _parent.height > __y) __y = _parent.y + _parent.height
        //             sub[j].y = __y
        //             __y += sub[j].height
        //         }
        //         if (_y > nextYearY) nextYearY = _y
        //         if (__y > nextYearY) nextYearY = __y
        //     }
        //     if (nextYearY > yearY) nextYearY += this.yearMargin
        //     yearY = nextYearY
        // }

        // let baselineY = this.root.y + this.root.height
        // let edges = [{x1: this.root.x, y1: baselineY, x2: this.root.x, y2: this.root.y, color: "black"}]
        // let leftMostX = 0
        // let rightMostX = 0
        // for (let id in this.nodesMap) {
        //     const node = this.nodesMap[id]
        //     if (node.parent.length > 0) {
        //         const parentNode = this.nodesMap[node.parent]
        //         if (node.parent === this.root.id) {
        //             edges.push({x1: node.x, y1: baselineY, x2: node.x, y2: node.y, color: node.color})
        //             if (node.x < leftMostX || leftMostX == 0) leftMostX = node.x
        //             if (node.x > rightMostX || rightMostX == 0) rightMostX = node.x
        //         } else {
        //             edges.push({x1: parentNode.x, y1: parentNode.y, x2: node.x, y2: node.y, color: node.color})
        //         }
        //     }
        // }
        // edges.push({x1: leftMostX, y1: baselineY, x2: rightMostX, y2: baselineY, color: "black"})

        // console.log(nodes, edges)

        const _width = this.branchWidth * this.data.branches.length
        const _height = eraY
        return <svg className='mrt' width={`${_width}px`} height={`${_height}px`} /*width="100%"*/ viewBox={`0 0 ${_width} ${_height}`}>
            {colorDefs}
            {edgesView.map((edge, idx) =>
                <line key={idx} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} strokeWidth={this.strokeWidth - 1} stroke={edge.color}/>
            )}
            {[nodesView.root, ...nodesView.branches.flat(Infinity)].map((nodeView, idx) => 
                <Node key={idx}
                      pins={nodeView.pins} 
                      x={nodeView.x} y={nodeView.y}
                      radius={this.radius}
                      lineHeight={this.lineHeight}
                      color={nodeView.color}
                    //   citations={node.citations}
                      fontSize={this.fontSize}
                      strokeWidth={this.strokeWidth}/>)}
        </svg>
    }
}
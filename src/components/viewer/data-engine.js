import _ from 'lodash'
import * as d3plus from 'd3plus-text'

export default class DataEngine {

    constructor(config) {
        this.config = config
        this.nodes = {}
        this.clusters = []
        this.eras = []
        this.grid = []
        this.root = null
        this.adaptor = new DataAdaptor()
    }

    add(paper, branch) {
        const src = this.adaptor.adapt(paper)
        const node = new Node(src, branch)
        this.nodes[src.id] = node
        if (branch) branch.nodes.push(node)
        return node
    }

    __generateEra() {
        this.eras = []
        let years = _.flattenDepth(this.clusters.map(cluster => cluster.branches.map(branch => branch.nodes.map(node => node.src.year))), 2).sort().reverse()
        let _to = years[0]
        let _cnt = 1
        let eraMinSize = this.config.EraMinRatio * years.length
        let lastEraMinSize = this.config.LastEraRatio * years.length
        for (let i = 1; i < years.length; i++) {
            if (years[i] === years[i-1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) _cnt += 1
            else {
                this.eras.push(new Era(years[i-1], _to, _cnt, this.eras.length))
                _to = years[i]
                _cnt = 1
            }
        }
        this.eras.push(new Era(years[years.length-1], _to, _cnt, this.eras.length))
    }

    __generateGrid() {
        this.grid = this.eras.map(era => 
            _.flatten(this.clusters.map(cluster => {
                const branches = cluster.branches.map(branch => {
                    const ns = branch.nodes.filter(node => node.src.year >= era.from && node.src.year <= era.to)
                    ns.forEach(node => node.era = era)
                    return new Cell(ns, era, cluster, branch)
                })
                return [branches.length > 0 ? branches[0] : [], 
                        branches.length > 1 ? branches[1] : []]
            }))
        )
    }

    __generatePlacement() {
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
        // locate root
        this.root.x = (this.clusters.length - 0.5) * this.config.CellWidth + this.config.CellTextOffsetX
        this.root.y = this.config.CellTextOffsetY + this.config.CellTextLineHeight / 2
        this.root.segments = [this.root.src.text]
        this.root.height = this.config.CellPaddingTop + this.config.CellOrbmentRadius * 2 + this.config.CellPaddingBottom
        // locate horizon
        this.horizon = {y: this.root.height + this.config.HorizonMarginTop}
        // locate cells
        let y = this.horizon.y + this.config.HorizonMarginBottom
        this.grid.forEach((row, i) => {
            this.eras[i].y = y
            row.forEach((cell, j) => {
                const _x = this.config.CellWidth * j + this.config.CellTextOffsetX
                let _y = y + this.config.CellTextOffsetY
                cell.x = j * this.config.CellWidth
                cell.y = y
                cell.expandable = (j + 1 !== this.clusters.length * 2) // not the last branch
                    && (!this.config.DisableTextBranchSpan) // allow branch span
                    && (!this.config.DisableTextClusterSpan || j % 2 === 0) // allow cluster span or is the first branch in cluster
                    && (row[j+1].nodes.length === 0) // next branch has nothing                
                const wrap = cell.expandable ? wide_wrap : narrow_wrap
                cell.nodes.forEach(node => {
                    node.segments = wrap(node.src.text)
                    node.height = node.segments.lines.length * this.config.CellTextLineHeight
                    node.x = _x
                    node.y = _y
                    node.cell = cell
                    _y += node.height + this.config.CellTextMargin
                })
                
                cell.height = Math.max(
                    _y - this.config.CellTextOffsetY - y + this.config.CellPaddingBottom,
                    this.config.CellPaddingTop + 2 * this.config.CellOrbmentRadius + this.config.CellPaddingBottom
                )
            })
            this.eras[i].height = row.reduce((prev, cell) => Math.max(prev, cell.height), 0)
            y += this.eras[i].height
        })
        this.grid.forEach(row => row.forEach((cell, j) => {
            cell.overlayed = cell.nodes.length === 0 && j > 0 && row[j-1].expandable && row[j-1].nodes.length > 0
            cell.topConnectionPoint = cell.y + this.config.CellPaddingTop + this.config.CellOrbmentRadius -
                ((cell.overlayed) ? (this.config.CellTextLineHeight + this.config.CellTextMargin) : 0)
            cell.bottomConnectionPoint = cell.overlayed
                ? (cell.y + this.config.CellPaddingTop + this.config.CellOrbmentRadius)
                : (row[j-1].y + row[j-1].height - this.config.CellTextMargin)
        }))
        this.clusters.forEach(cluster => cluster.branches.forEach(branch => {
            const j = cluster.id * 2 + branch.id
            if (branch.length > 0) {
                branch[0].cell.isBranchTop = true
                for (let i = 0; i < branch[0].era.id; i++) this.grid[i][j].aboveBranchTop = true
            }
        }))
    }

    load(data) {
        this.root = this.add(data.root, null)
        // generate clusters
        this.clusters = data.branches.map((clusterSrc, clusterID) => {
            const cluster = new Cluster(clusterID, 
                data.clusterNames[clusterID].split(' ').map(_.capitalize).join(' '))
            clusterSrc.forEach((branch, branchID) => branch.forEach(paper => {
                this.add(paper, cluster.branches[branchID])
            }))
            return cluster
        })
        this.__generateEra()
        // sort branch nodes with score and year
        this.clusters.forEach(cluster => 
            cluster.branches.forEach(branch => 
                branch.nodes.sort((a, b) => 
                    (a.year === b.year)
                    ? (b.score - a.score)
                    : (b.year - a.year))))
        this.__generateGrid()
        this.__generatePlacement()
    }

}

export class Cell {
    constructor(nodes, era, cluster, branch) {
        this.nodes = nodes
        this.era = era
        this.cluster = cluster
        this.branch = branch
        this.expandable = true
    }
}

export class Era {
    constructor(from, to, cnt, id) {
        this.from = from
        this.to = to
        this.cnt = cnt
        this.id = id
    }
}

export class Branch {
    constructor(cluster, id) {
        this.cluster = cluster
        this.id = id
        this.nodes = []
    }
}

export class Cluster {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.branches = [new Branch(this, 0), new Branch(this, 1)]
    }
}

export class Node {
    constructor(src, branch) {
        this.src = src
        this.branch = branch
        this.era = null
    }
}

export class DataAdaptor {
    adapt(paper) {
        const id = paper["paper_id"]
        const year = paper["paper_year"]
        const venue = paper["paper_venue"].trim()
        const title = paper["paper_title"].trim()
        const citations = []
        const score = paper["paper_citations"]
        let prefix = `${year}`
        const venue_year = /^(19|20)\d{2}\b/.exec(venue)
        if (venue_year == null && venue.length > 0) {
            prefix = `${year} ${venue}`
        } else if (venue_year != null) {
            prefix = `${venue}`
        }
        const text = `[${prefix}] ${title}`.replace('\t', ' ').replace('\n', ' ')
        const abstract = paper["paper_abstract"] ? paper["paper_abstract"].trim().replace('\t', ' ') : ""
        return {id, year, venue, title, citations, score, text, abstract}
    }
}
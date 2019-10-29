import _ from 'lodash'

function adapter(paper) {
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

export default class DataView {
 
    constructor(data, userEdits, config) {
        const { HideSubBranch, EraMinRatio, LastEraRatio } = config
        this.root = adapter(data.root)
        const branches = _.flatten(data.branches).map(() => [])
        const years = []
        data.branches.forEach((cluster, clusterID) => 
            cluster.forEach((branch, idx) => {
                if (HideSubBranch && idx > 0) return
                branch.forEach(raw => {
                    const paper = adapter(raw)
                    paper.isSub = idx > 0
                    paper.edits = userEdits[paper.id]
                    paper.clusterID = paper.edits ? paper.edits.clusterID : clusterID
                    paper.branchID = paper.clusterID * 2 + paper.isSub
                    branches[paper.branchID].push(paper)
                    years.push(paper.year)
                })
            }
        ))
        this.eras = this.__calculateEras(years, EraMinRatio, LastEraRatio)
        this.grid = this.__calculateGrid(this.eras, branches)
        this.gridT = this.grid[0].map((col, i) => this.grid.map(row => row[i]))
    }

    __calculateEras(years, eraMinRatio, lastEraRatio) {
        years.sort().reverse()
        let eras = []
        let _to = years[0]
        let _cnt = 1
        let eraMinSize = eraMinRatio * years.length
        let lastEraMinSize = lastEraRatio * years.length
        for (let i = 1; i < years.length; i++) {
            if (years[i] === years[i-1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) _cnt += 1
            else {
                eras.push({from: years[i-1], to: _to, cnt: _cnt})
                _to = years[i]
                _cnt = 1
            }
        }
        eras.push({from: years[years.length-1], to: _to, cnt: _cnt})
        return eras
    }

    __calculateGrid(eras, branches) {
        return eras.map((era, eraID) => branches.map((branch, branchID) => {
            const cell = {
                eraID, branchID,
                clusterID: Math.floor(branchID / 2),
                pins: branch.filter(paper => paper.year >= era.from && paper.year <= era.to)
                    .sort((a, b) => (a.year === b.year) ? (b.citations - a.citations) : (b.year - a.year))
            }
            cell.pins.forEach(pin => pin.cell = cell)
            return cell
        }))
    }
}
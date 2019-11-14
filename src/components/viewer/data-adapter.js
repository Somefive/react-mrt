import lodash from 'lodash'

export default class DataAdapter {
    
    constructor(data, config) {
        this.data = {
            root: this.__extract(data.root),
            branches: lodash.flatten(data.branches).map(branch => 
                branch.map(this.__extract).sort((a, b) => 
                    (a.year === b.year) ? (b.citations - a.citations) : (b.year - a.year)
                )
            )
        }
        this.config = config
    }

    __extract(paper) {
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

    _calculateEras() {
        let eras = []
        let years = lodash.flatten(this.data.branches).map(paper => paper.year).sort().reverse()
        let _to = years[0]
        let _cnt = 1
        let eraMinSize = this.config.EraMinRatio * years.length
        let lastEraMinSize = this.config.LastEraRatio * years.length
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

    dataGrid() {
        const eras = this._calculateEras()
        const dataGrid = eras.map(era => 
            this.data.branches.map(branch => 
                branch.filter(paper => 
                    paper.year >= era.from && paper.year <= era.to)))
        return dataGrid
    }

}
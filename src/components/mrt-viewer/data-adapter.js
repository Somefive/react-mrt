export default function(paper) {
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
import _ from 'lodash';
import { defaultPaperNode } from 'react-mrt';

export default class PapersTransformer {
    static transform(data) {
        let mrtData = {
            blocks: [],
            columns: [],
            clusters: []
        };
        mrtData.root = {
            nodes: [this.toPaperNode(data.root)],
        };
        
        let eras = this.calcEars(data);
        let clusterLen = data.branches.length;
        for(let cIndex=0; cIndex < clusterLen; ++cIndex) {
            mrtData.clusters.push({
                name: data.clusterNames[cIndex],
                value: data.importance[cIndex]
            })
            let cluster = data.branches[cIndex];
            let columnLen = cluster.length;
            for(let columnIndex=0; columnIndex < columnLen; ++columnIndex) {
                let columnData = cluster[columnIndex];
                let blocks = [];
                columnData.sort((a, b) => (a.paper_year === b.paper_year) ? (b.paper_citations.length - a.paper_citations.length) : (b.paper_year - a.paper_year));
                columnData.reduce((prev, current) => {
                    let node = this.toPaperNode(current);
                    for(let e=0; e < eras.length; ++e) {
                        let era = eras[e];
                        if(node.year >= era.from && node.year <= era.to) {
                            let row = e;
                            if(prev && prev.row === row) {
                                prev.nodes.push(node);
                                return prev;
                            }else {
                                let block = {
                                    clusterIndex: cIndex,
                                    column: columnIndex,
                                    row,
                                    nodes: [node],
                                }
                                blocks.push(block);
                                return block;
                            }
                        }
                    }
                    return null;
                }, undefined);
                mrtData.blocks.push(...blocks);
                let column = {
                    clusterIndex: cIndex,
                    index: columnIndex,
                    rowStart: blocks[0].row,
                    columnStart: 0
                }
                mrtData.columns.push(column);
            }
        }
    
        return mrtData;
    }
    
    static calcEars(data) {
        let eras = [];
        let years = _.flattenDeep(data.branches).map(paper => paper.paper_year).sort().reverse();
        let _to = years[0];
        let _cnt = 1;
        let eraMinSize = this.EraMinRatio * years.length;
        let lastEraMinSize = 0.14 * years.length;
        for (let i = 1; i < years.length; i++) {
            if (years[i] === years[i-1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) {
                _cnt += 1;
            } else {
                eras.push({from: years[i-1], to: _to, cnt: _cnt});
                _to = years[i];
                _cnt = 1;
            }
        }
        eras.push({from: years[years.length-1], to: _to, cnt: _cnt});
        return eras;
    }
    
    static toPaperNode(input) {
        let node = {...defaultPaperNode};
        node.id = input.paper_id;
        node.link_out = input.references;
        node.year = input.paper_year;
        node.abstract = input.paper_abstract;
        node.venue = input.paper_venue.trim();
        node.citations = input.paper_citations;
        node.score = input.score;
        node.title = input.paper_title.trim();
        let prefix = `${node.year}`;
        let venue_year = /^(19|20)\d{2}\b/.exec(node.venue);
        if(venue_year != null) {
            prefix = `${node.venue}`;
        } else if(node.venue.length) {
            prefix = `${node.year} ${node.venue}`;
        }
        node.name = `[${prefix}] ${node.title}`.replace('\t', " ").replace('\n', " ");
        return node;
    }
}
import _ from 'lodash';
import { defaultPaperNode } from 'react-mrt';

export default class PapersTransformer {
    static transform(data) {
        let tree = {};
        let root = tree.root = {
            nodes: [this.toPaperNode(data.root)],
            children: []
        };
        let eras = this.calcEars(data);
        let blen = data.branches.length;
        for(let b=0; b < blen; ++b) {
            let branch = data.branches[b];
            let cluster = {
                name: b < data.clusterNames.length ? data.clusterNames[b] : "",
                weight: b < data.importance.length ? data.importance[b] : 0,
                nodes: [],
                children: []
            };
            let subClusters = [];
            for(let sub of branch) {
                sub.sort((a, b) => (a.paper_year === b.paper_year) ? (b.paper_citations.length - a.paper_citations.length) : (b.paper_year - a.paper_year));
                sub.reduce((prev, current) => {
                    let node = this.toPaperNode(current);
                    for(let e=0; e < eras.length; ++e) {
                        let era = eras[e];
                        if(node.year >= era.from && node.year <= era.to) {
                            let rank = e;
                            if(prev && prev.rank === rank) {
                                prev.nodes.push(node);
                                return prev;
                            }else {
                                let newCluster = {
                                    rank,
                                    nodes: [node],
                                    children: []
                                }
                                if(prev) {
                                    prev.next = newCluster;
                                }else {
                                    subClusters.push(newCluster);
                                }
                                return newCluster;
                            }
                        }
                    }
                    return null;
                }, undefined);
            }
            for(let s=0; s < subClusters.length; ++s) {
                let sub = subClusters[s];
                if(s === 0) {
                    cluster.children.push(sub);
                }else {
                    let first = subClusters[0];
                    if(first.rank >= sub.rank) {
                        cluster.children.push(sub);
                    }else {
                        this.insertCluster(first, sub);
                    }
                }
            }
            root.children.push(cluster);
        }
    
        return tree;
    }

    static insertCluster(start, child) {
        if(!start.next) {
            start.children.push(child);
        }else {
            if(start.next.rank >= child.rank) {
                start.children.push(child);
            }else {
                return this.insertCluster(start.next, child);
            }
        }
    }
    
    static calcEars(data) {
        let eras = [];
        let years = _.flattenDeep(data.branches).map(paper => paper.paper_year).sort().reverse();
        let _to = years[0];
        let _cnt = 1;
        let eraMinSize = this.EraMinRatio * years.length;
        let lastEraMinSize = this.lastEraRatio * years.length;
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
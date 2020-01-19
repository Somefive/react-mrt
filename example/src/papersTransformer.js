import _ from 'lodash';
import { defaultPaperNode } from 'react-mrt';

const transformMrtData = (data, userEdits) => {
  let mrtData = {
    blocks: [],
    columns: [],
    clusters: []
  };
  mrtData.root = {
    nodes: [toPaperNode(data.root)],
  };
  if(userEdits) {
    for(let nodeId in userEdits) {
      let edit = userEdits[nodeId];
      let pos = getPositionByBranches(data.branches, nodeId);
      if(pos) {
        let {cluster, sub, index} = pos
        if(edit.clusterId !== undefined && cluster !== edit.clusterId) {
          let nodes = data.branches[cluster][sub].splice(index, 1);
          if(data.branches[edit.clusterId]) {
            if(data.branches[edit.clusterId].length > sub) {
              data.branches[edit.clusterId][sub].push(...nodes);
            }else {
              data.branches[edit.clusterId][0].push(...nodes);
            }
          }
        }
      }
      if (nodeId === mrtData.root.nodes[0].id) {
        mrtData.root.nodes[0].like = edit.rate === 1;
        mrtData.root.nodes[0].dislike = edit.rate === -1;
      }
    }
  }
  let eras = calcEars(data);
  let clusterLen = data.branches.length;
  let sortedClusterImportance = [...data.importance].sort()
  for (let cIndex = 0; cIndex < clusterLen; ++cIndex) {
    let clusterName = data.clusterNames[cIndex];
    clusterName = clusterName.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
      return $1.toUpperCase() + $2.toLowerCase();
    });
    mrtData.clusters.push({
      name: clusterName,
      value: sortedClusterImportance.indexOf(data.importance[cIndex]) / data.importance.length
    })
    let cluster = data.branches[cIndex];
    let columnLen = cluster.length;
    for (let columnIndex = 0; columnIndex < columnLen; ++columnIndex) {
      let columnData = cluster[columnIndex];
      if(columnData && columnData.length) {
        let blocks = [];
        columnData.sort((a, b) => (a.paper_year === b.paper_year) ? (b.paper_citations.length - a.paper_citations
          .length) : (b.paper_year - a.paper_year));
        columnData.reduce((prev, current) => {
          let node = toPaperNode(current, data.root);
          let nodeEdits = userEdits && userEdits[node.id];
          if(nodeEdits) {
            node.like = nodeEdits.rate === 1;
            node.dislike = nodeEdits.rate === -1;
          }
          for (let e = 0; e < eras.length; ++e) {
            let era = eras[e];
            if (node.year >= era.from && node.year <= era.to) {
              let row = e;
              if (prev && prev.row === row) {
                prev.nodes.push(node);
                return prev;
              } else {
                let block = {
                  clusterIndex: cIndex,
                  column: columnIndex,
                  row,
                  nodes: [node]
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
    mrtData.blocks.reduce((array, block) => { array.push(...block.nodes); return array; }, [])
      .sort((a, b) => b.score - a.score)
      .forEach((paper, index, all) => {
        let total = all.length;
        paper.scoreRank = index;
        if(index < total * 0.1) paper.level = 3;
        else if(index < total * 0.3) paper.level = 2;
        else if(index < total * 0.6) paper.level = 1;
        else paper.level = 0;
      })
      mrtData.blocks.forEach(block => {
        let maxLevel = Math.max.apply(null, block.nodes.map(v => v.level));
        block.weight = maxLevel / 3;
      })
  }

  return mrtData;
}

const getPositionByBranches = (branches, nodeId) => {
  for(let clusterIndex=0; clusterIndex < branches.length; ++clusterIndex) {
    let branch = branches[clusterIndex];
    for(let subIndex=0; subIndex < branch.length; ++subIndex) {
      let subBranch = branch[subIndex];
      for(let i=0; i < subBranch.length; ++i) {
        let node = subBranch[i];
        if(node.paper_id === nodeId) {
          return {
            cluster: clusterIndex,
            sub: subIndex,
            index: i
          }
        }
      }
    }
  }
}

const calcEars = (data) => {
  let eras = [];
  let years = _.flattenDeep(data.branches)
    .map(paper => paper.paper_year)
    .sort()
    .reverse();
  let _to = years[0];
  let _cnt = 1;
  let eraMinSize = 0.05 * years.length;
  let lastEraMinSize = 0.2 * years.length;
  for (let i = 1; i < years.length; i++) {
    if (years[i] === years[i - 1] || _cnt < eraMinSize || i > years.length - lastEraMinSize) {
      _cnt += 1;
    } else {
      eras.push({ from: years[i - 1], to: _to, cnt: _cnt });
      _to = years[i];
      _cnt = 1;
    }
  }
  eras.push({ from: years[years.length - 1], to: _to, cnt: _cnt });
  return eras;
}

const toPaperNode = (input, root) => {
  let node = { ...defaultPaperNode };
  node.id = input.paper_id;
  node.link_in = input.citations;
  node.link_out = input.references;
  if(root) {
    if(node.link_in && node.link_in.indexOf(root.paper_id) >= 0) {
      node.link_in.splice(node.link_in.indexOf(root.paper_id), 1);
    }
    if(node.link_out && node.link_out.indexOf(root.paper_id) >= 0) {
      node.link_out.splice(node.link_out.indexOf(root.paper_id), 1);
    }
  }
  node.year = input.paper_year;
  node.abstract = input.paper_abstract;
  node.venue = input.paper_venue.trim();
  // node.citations = input.paper_citations;
  node.score = input.score;
  node.title = input.paper_title.trim();
  node.authors = input.paper_authors;
  node.editable = true;
  let prefix = `${node.year}`;
  let venue_year = /^(19|20)\d{2}\b/.exec(node.venue);
  if (venue_year != null) {
    prefix = `${node.venue}`;
  } else if (node.venue.length) {
    prefix = `${node.year} ${node.venue}`;
  }
  node.name = `[${prefix}] ${node.title}`.replace('\t', " ")
    .replace('\n', " ");
  return node;
}

export {
  transformMrtData
}

import React from 'react'
import { MRT, adapters, recommenders /*, OMRT*/ } from 'react-mrt'
import './App.css'
import sample_data from './sample.json'
import 'antd/dist/antd.css'
import html2canvas from 'html2canvas'

class App extends React.Component {

  constructor(props) {
    super(props)
    console.log("Sample_data: ", sample_data);
    this.state = {
      data: sample_data,
      like: false,
      userEdits: {}
    };
  }

  onEdit(action, nodeId, value) {
    let edit_data = {...this.state.userEdits};
    let edit = edit_data[nodeId];
    if(!edit) {
      edit = edit_data[nodeId] = {}
    }
    switch(action) {
      case "thumb-delete":
        edit.rate = 0;
        break;
      case "thumb-up":
        edit.rate = 1;
        break;
      case "thumb-down":
        edit.rate = -1;
        break;
      case "exchange":
        edit.clusterId = value;
        break;
      default:
        return
    }
    this.setState({userEdits: edit_data})
  }

  render() {
    const adapter = new adapters.PaperAdapter()
    const adapterInput = {data: this.state.data, userEdits: this.state.userEdits}
    const transformedData = adapter.transform(adapterInput)
    const embeddings = adapter.transformEmbeddings(adapterInput)
    const rlgruModel = adapter.transformRLGRUModel(adapterInput)
    const rootID = this.state.data.root.paper_id
    let recommender = undefined
    if (embeddings) {
      if (rlgruModel) recommender = new recommenders.RLGRURecommender(embeddings, rlgruModel, rootID, new Set([rootID]), 5)
      else recommender = new recommenders.SimilarityRecommender(embeddings, rootID, new Set([rootID]), 5)
    }
    return (
      <div className="App">
        <MRT data={transformedData} authors={["Somefive", "Rainatum", "Zelda", "Yiping", "Jizhong"]}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEdit={(action, nodeId, value) => this.onEdit(action, nodeId, value)} userEdits={this.state.userEdits}
          lang="en" shareable={true} likeable={true} loadable={true} onLoadJson={(json) => this.setState({data: json})}
          html2canvas={html2canvas}
          recommender={recommender}/>
        {/* <OMRT data={data} authors={["Somefive", "Rainatum"]} onLoadJson={this.handleDataChange}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEditChange={(edits) => this.setState({userEdits: edits})} userEdits={this.state.userEdits}
          lang="en"/> */}
      </div>
    );
  }
}

export default App;

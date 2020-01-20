import React from 'react'
import { MRT /*, OMRT*/ } from 'react-mrt'
import './App.css'
import sample_data from './sample.json'
import 'antd/dist/antd.css'
import { transformMrtData } from './papersTransformer'

class App extends React.Component {

  constructor(props) {
    super(props)
    console.log("Sample_data: ", sample_data);

    this.EraMinRatio = 0.05;
    this.lastEraRatio = 0.2;

    this.state = {
      data: sample_data,
      like: false,
      userEdits: {}
    };
  }

  handleDataChange(data) {
    this.setState({data});
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
    let transformedData = transformMrtData(this.state.data, this.state.userEdits);
    return (
      <div className="App">
        <MRT data={transformedData} authors={["Somefive", "Rainatum", "Zelda", "Yiping", "Jizhong"]} onLoadJson={this.handleDataChange}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEdit={(action, nodeId, value) => this.onEdit(action, nodeId, value)} userEdits={this.state.userEdits}
          lang="en" shareable={true} likeable={true} loadable={true} onLoadJson={(json) => this.setState({data: json})}/>
        {/* <OMRT data={data} authors={["Somefive", "Rainatum"]} onLoadJson={this.handleDataChange}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEditChange={(edits) => this.setState({userEdits: edits})} userEdits={this.state.userEdits}
          lang="en"/> */}
      </div>
    );
  }
}

export default App;

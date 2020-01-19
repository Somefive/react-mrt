import React from 'react'
import { MRT, OMRT } from 'react-mrt'
import './App.css'
import sample_data from './sample.json'
import 'antd/dist/antd.css'
import PapersTransformer from './papersTransformer'

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

  render() {
    let data = this.state.data;
    let transformedData = PapersTransformer.transform(this.state.data);
    console.log(transformedData)
    return (
      <div className="App">
        <MRT data={transformedData} authors={["Somefive", "Rainatum"]} onLoadJson={this.handleDataChange}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEditChange={(edits) => this.setState({userEdits: edits})} userEdits={this.state.userEdits}
          lang="en" shareable={true} likeable={true}/>
        {/* <OMRT data={data} authors={["Somefive", "Rainatum"]} onLoadJson={this.handleDataChange}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEditChange={(edits) => this.setState({userEdits: edits})} userEdits={this.state.userEdits}
          lang="en"/> */}
      </div>
    );
  }
}

export default App;

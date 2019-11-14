import React from 'react';
import './App.css';
import sample_data from './sample.json';
import MRT from './components';

class App extends React.Component {
  
  constructor(props) {
    super(props)
    this.state = {data: sample_data, like: false, userEdits: {}}
  }

  render() {
    return (
      <div className="App">
        <MRT data={this.state.data} authors={["Somefive", "Rainatum"]} onLoadJson={(data) => this.setState({data})}
          onLike={() => this.setState({like: !this.state.like})} like={this.state.like}
          onEditChange={(edits) => this.setState({userEdits: edits})} userEdits={this.state.userEdits}
          lang="en"/>
      </div>
    );
  }
}

export default App;

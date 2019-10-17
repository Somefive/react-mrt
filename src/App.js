import React from 'react';
import './App.css';
import sample_data from './sample.json';
import MRT from './components';

class App extends React.Component {
  
  constructor(props) {
    super(props)
    this.state = {data: sample_data}
  }

  render() {
    return (
      <div className="App">
        <MRT data={this.state.data} authors={["Somefive", "Rainatum"]} onLoadJson={(data) => this.setState({data})}/>
      </div>
    );
  }
}

export default App;

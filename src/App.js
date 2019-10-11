import React from 'react';
import './App.css';
import sample_data from './sample.json';
import MRT from './components';

function App() {
  return (
    <div className="App">
      <MRT data={sample_data} authors={["Somefive", "Rainatum"]}/>
    </div>
  );
}

export default App;

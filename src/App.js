import React from 'react';
import './App.css';
import sample_data from './sample.json';
import MRT from './components';

function App() {
  return (
    <div className="App">
      <div>
        <MRT data={sample_data}/>
      </div>
    </div>
  );
}

export default App;

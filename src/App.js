import React from 'react';
import logo from './logo.svg';
import './App.css';
import MRT from './components/mrt';
import sample_data from './sample.json';

function App() {
  return (
    <div className="App">
      <MRT data={sample_data}/>
    </div>
  );
}

export default App;

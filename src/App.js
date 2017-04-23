import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  fetchData = () => {
    fetch('/api/people/1/')
    .then((response) => response.json())
    .then((json) => console.log(json))
  } 
  render() {
    this.fetchData()
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;

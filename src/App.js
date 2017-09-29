// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
const hypercore = require('hypercore')
const pump = require('pump')
const ram = require('random-access-memory')
const signalhub = require('signalhub')
const webrtcSwarm = require('webrtc-swarm')

const feed = hypercore(file => ram(), {valueEncoding: 'json'})
feed.ready(() => {
  const hub = signalhub('datter/' + feed.key.toString('hex'), 'localhost:1337')
  const swarm = webrtcSwarm(hub)
  const peer = feed.replicate()
  let peerCount = 0
  swarm.on('peer', connection => {
    console.log('CONNECT', peerCount++, 'peers for', feed.key.toString('hex'))
    pump(peer, connection, peer, () => {
      console.log('DISCONNECT:', peerCount--, 'peers for', feed.key.toString('hex'))
    })
  })
})

class App extends Component<void, void> {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;

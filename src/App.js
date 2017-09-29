// @flow
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
const hypercore = require('hypercore')
const pump = require('pump')
const ram = require('random-access-memory')
const signalhub = require('signalhub')
const webrtcSwarm = require('webrtc-swarm')

global.connect = function connect (key) {
  const feed = hypercore(file => ram(), key, {valueEncoding: 'json'})
  feed.ready(() => {
    console.log(feed.key.toString('hex'), feed.writable)

    const hub = signalhub('datter/' + feed.key.toString('hex'), 'localhost:1337')
    const swarm = webrtcSwarm(hub)
    let peerCount = 0
    swarm.on('peer', connection => {
      console.log('CONNECT', ++peerCount, 'peers for', feed.key.toString('hex'))
      const peer = feed.replicate({live: true})
      pump(peer, connection, peer, () => {
        console.log('DISCONNECT:', --peerCount, 'peers for', feed.key.toString('hex'))
      })
    })

    setInterval(() => {
      if (feed.writable && peerCount > 0) {
        console.log('.')
        feed.append({liveAndDirect: +Date.now()})
      }
    }, 1000)

    if (!feed.writable) {
      feed.createReadStream({live: true}).on('data', chunk => {
        console.log(chunk)
      })
    }
  })
}


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

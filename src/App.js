// @flow
import React, { Component } from 'react'
import redux from 'tinyredux'
const hypercore = require('hypercore')
const pump = require('pump')
const idb = require('random-access-idb')
const signalhub = require('signalhub')
const webrtcSwarm = require('webrtc-swarm')
const nanobus = require('nanobus')

const debug = true

function connect (readKey) {
  const events = nanobus()

  if (debug) {
    events.on('*', (name, data) => console.log(name, data))
  }

  const feed = hypercore(file => idb(readKey ? 'datter/' + readKey : 'datter/me')(file), readKey, {valueEncoding: 'json'})
  feed.ready(() => {
    const key = feed.key.toString('hex')
    events.emit('ready', key)
    const hub = signalhub('datter/' + key, 'localhost:1337')
    const swarm = webrtcSwarm(hub)
    let peerCount = 0
    swarm.on('peer', connection => {
      events.emit('peer/connect', ++peerCount)
      const peer = feed.replicate({live: true})
      pump(peer, connection, peer, () => {
        events.emit('peer/disconnect', --peerCount)
      })
    })

    if (feed.writable) {
      events.on('write', chunk => {
        feed.append(chunk, err => {
          if (err) console.error(err)
        })
      })
    }

    feed.createReadStream({live: true}).on('data', chunk => {
      events.emit('read', chunk)
    })
  })

  return events
}

global.connect = connect

const initialState = {
  key: null,
  peerCount: 0,
  messages: [],
}

function u (...updates) {
  return Object.assign({}, ...updates)
}

function action (type, payload) {
  return {type, payload}
}

function reducer (state = initialState, {type, payload}) {
  switch (type) {
    case 'me/ready': {
      return u(state, {key: payload})
    }
    case 'me/peer/connect':
    case 'me/peer/disconnect': {
      return u(state, {peerCount: payload})
    }
    case 'me/read': {
      const message = {
        author: 'me',
        content: payload,
      }
      return u(state, {messages: state.messages.concat([message])})
    }
    case 'other/ready': {
      // TODO
    }
    default:
  }
  return state
}

class App extends Component<void, void> {
  join: (key: string) => void
  write: (message: string) => void

  constructor (props) {
    super(props)
    const {dispatch} = props
    const feed = connect()
    feed.on('ready', key => dispatch(action('me/ready', key)))
    feed.on('peer/connect', peerCount => dispatch(action('me/peer/connect', peerCount)))
    feed.on('peer/disconnect', peerCount => dispatch(action('me/peer/disconnect', peerCount)))
    feed.on('read', message => dispatch(action('me/read', message)))
    this.join = key => {
      const feed = connect(key)
      feed.on('ready', key => dispatch(action('other/ready', key)))
      feed.on('peer/connect', peerCount => dispatch(action('other/peer/connect', {key, peerCount})))
      feed.on('peer/disconnect', peerCount => dispatch(action('other/peer/disconnect', {key, peerCount})))
      feed.on('read', message => dispatch(action('other/read', {key, message})))
    }
    this.write = message => feed.emit('write', {
      message,
      ts: +Date.now(),
    })
  }

  render() {
    const {
      key,
      peerCount,
      messages,
    } = this.props.state
    return (
      <div>
        <div>{key}</div>
        <div>{peerCount}</div>
        <div>{messages.map((message, i) => <div key={i}>{JSON.stringify(message)}</div>)}</div>
        <input onKeyDown={e => {e.key === 'Enter' && this.write(e.target.value)}} type="text" />
        <input onKeyDown={e => {e.key === 'Enter' && this.join(e.target.value)}} type="text" />
      </div>
    )
  }
}

export default redux(App, reducer);

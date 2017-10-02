// @flow
import './App.css'
import {EditableText, FocusStyleManager, InputGroup, Text} from '@blueprintjs/core'
import '@blueprintjs/core/dist/blueprint.css'
import React, { Component } from 'react'
import redux from 'tinyredux'
const hypercore = require('hypercore')
const pump = require('pump')
const idb = require('random-access-idb')
const ram = require('random-access-memory')
const signalhub = require('signalhub')
const sodium = require('sodium-universal')
const webrtcSwarm = require('webrtc-swarm')
const nanobus = require('nanobus')

FocusStyleManager.onlyShowFocusOnTabs()

const debug = true
// window.localStorage.debug = 'webrtc-swarm'
const persist = true
const hubs = ['localhost:1337']

function connect (readKey) {
  const events = nanobus()

  if (debug) {
    events.on('*', (name, data) => console.log(name, data))
  }

  const feed = hypercore(
    file => persist ? idb(readKey ? 'datter/' + readKey : 'datter/me')(file) : ram(),
    readKey,
    {valueEncoding: 'json'}
  )
  feed.ready(() => {
    const key = feed.key.toString('hex')
    events.emit('ready', key)
    const hub = signalhub('datter/' + key, hubs)
    const swarm = webrtcSwarm(hub)
    swarm.on('peer', (peer, id) => {
      events.emit('peer/connect', swarm.peers.length)
      const replicate = feed.replicate({live: true})
      pump(replicate, peer, replicate, () => {
        events.emit('peer/disconnect', swarm.peers.length)
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

// // works
// global.testConnect = function () {
//   const self = connect()
//   self.on('ready', key => {
//     const other = connect(key)
//     other.on('peer/connect', peers => {
//       console.log('peers!', peers)
//       self.emit('write', {hello: 'world'})
//     })
//     other.on('read', message => {
//       console.log(message)
//     })
//   })
// }

// // works
// global.testHub = function (key) {
//   const hub = signalhub('test_' + key, hubs)
//   const swarm = webrtcSwarm(hub)
//   swarm.on('peer', function () {
//     console.log('peer', arguments)
//   })
// }

type MessageType = {
  author: string,
  content: any & {
    ts: number,
  },
}

type StateType = {|
  key: string,
  peers: {[key: string]: number},
  messages: Array<MessageType>,
  following: {[key: string]: boolean},
|}

const initialState: StateType = {
  key: '',
  peers: {},
  messages: [],
  following: {},
}

function u (...updates) {
  return Object.assign({}, ...updates)
}

function action (type, payload) {
  return {type, payload}
}

// Add a new message to the feed, ordering by timestamp
function insert (messages: Array<MessageType>, message: MessageType) {
  return messages.concat([message]).sort((a, b) => {
    return (b.content.ts || 0) - (a.content.ts || 0)
  })
}

function reducer (state = initialState, {type, payload}) {
  switch (type) {
    case 'me/ready': {
      return u(state, {key: payload})
    }
    case 'me/peer/connect':
    case 'me/peer/disconnect': {
      return u(state, {peers: u(state.peers, {[state.key]: payload})})
    }
    case 'me/read': {
      const message = {
        author: state.key,
        content: payload,
      }
      return u(state, {messages: insert(state.messages, message)})
    }
    case 'other/ready': {
      const key = payload
      return u(state, {following: u(state.following, {[key]: true})})
    }
    case 'other/peer/connect':
    case 'other/peer/disconnect': {
      const {key, peerCount} = payload
      return u(state, {peers: u(state.peers, {[key]: peerCount})})
    }
    case 'other/read': {
      const message = {
        author: payload.key,
        content: payload.message,
      }
      return u(state, {messages: insert(state.messages, message)})
    }
    default:
  }
  return state
}

// Use the prefix of the (blake2b) hash of the given key as a color code.
// We use the hash rather than the original key so that the color is sensitive to typos.
function keyToColor (key) {
  const digest = new Buffer(32)
  sodium.crypto_generichash_batch(digest, key)
  return '#' + digest.toString('hex').slice(0, 6)
}

function Following ({peers}) {
  const keys = Object.keys(peers)
  if (keys.length < 1) {
    return <div>Peers: 0</div>
  }
  return (
    <div>Peers: {keys.map(key => <span key={key} title={key} style={{backgroundColor: keyToColor(key)}}>{peers[key]}</span>)}</div>
  )
}

class Follow extends Component<{onFollow: string => void}, {key: string}> {
  inputRef: HTMLInputElement

  static keyLength = 64

  state = {
    key: '',
    error: false,
  }

  onChange (e) {
    const key = e.target.value
    this.setState({key})
    if (key.length === Follow.keyLength) {
      this.inputRef.style.backgroundColor = keyToColor(key)
    } else {
      this.inputRef.style.backgroundColor = ''
    }
  }

  onFollow () {
    if (this.state.key.length !== Follow.keyLength) {
      return
    }
    this.props.onFollow(this.state.key)
  }

  render () {
    const {key} = this.state
    const textboxColor = key.length === Follow.keyLength
      ? 'pt-intent-success' // green
      : key.length > 0
        ? 'pt-intent-danger' // red
        : '' // none
    return (
      <InputGroup
        className={`key-input ${textboxColor}`}
        inputRef={ref => this.inputRef = ref}
        placeholder={'Paste key to follow...'}
        onChange={e => this.onChange(e)}
        onKeyDown={e => e.key === 'Enter' && this.onFollow()}
        rightElement={
          <button type="button" className={'pt-button pt-intent-primary'} onClick={() => this.onFollow()}>
            Follow
          </button>
        }
      />
    )
  }
}

class WriteMessage extends Component<{onSend: string => void}, {message: string}> {
  state = {
    message: ''
  }

  onSend () {
    this.props.onSend(this.state.message)
    this.setState({message: ''})
  }

  render () {
    return (
      <div className="WriteMessage">
        <EditableText
          multiline
          minLines={3}
          maxLines={10}
          placeholder={`What's happing in the hyperworld?`}
          value={this.state.message}
          onChange={value => this.setState({message: value})}
        />
        <button type="button" className="pt-button pt-intent-primary" onClick={() => this.onSend()}>Send :)</button>
      </div>
    )
  }
}

const Key = ({k}) => (
  <span className="pt-tag pt-large key" style={{backgroundColor: keyToColor(k)}}>{k}</span>
)

class Message extends Component<{message: MessageType}, void> {
  render () {
    const {message} = this.props
    return (
      <div className="Message">
        <div className="author"><Key k={message.author} /></div>
        <Text>{message.content.text}</Text>
      </div>
    )
  }
}

class App extends Component<{state: StateType, dispatch: any => void}, void> {
  write: (message: string) => void
  follow: (key: string) => void

  componentDidMount () {
    const {dispatch} = this.props
    const feed = connect()
    feed.on('ready', key => dispatch(action('me/ready', key)))
    feed.on('peer/connect', peerCount => dispatch(action('me/peer/connect', peerCount)))
    feed.on('peer/disconnect', peerCount => dispatch(action('me/peer/disconnect', peerCount)))
    feed.on('read', message => dispatch(action('me/read', message)))
    this.follow = key => {
      const feed = connect(key)
      feed.on('ready', key => dispatch(action('other/ready', key)))
      feed.on('peer/connect', peerCount => dispatch(action('other/peer/connect', {key, peerCount})))
      feed.on('peer/disconnect', peerCount => dispatch(action('other/peer/disconnect', {key, peerCount})))
      feed.on('read', message => dispatch(action('other/read', {key, message})))
    }
    this.write = text => feed.emit('write', {
      text,
      ts: +Date.now(),
    })
  }

  render() {
    const {
      key,
      peers,
      messages,
    } = this.props.state
    return (
      <div className="App">
        <Follow onFollow={this.follow} />
        <div className="Profile">
          <Key k={key} />
          <Following peers={peers} />
        </div>
        <WriteMessage onSend={this.write} />
        <div>{messages.map((message, i) => <Message message={message} />)}</div>
      </div>
    )
  }
}

export default redux(App, reducer)

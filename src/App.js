// @flow
import React, { Component } from 'react'
import redux from 'tinyredux'
const hypercore = require('hypercore')
const pump = require('pump')
const idb = require('random-access-idb')
const ram = require('random-access-memory')
const signalhub = require('signalhub')
const webrtcSwarm = require('webrtc-swarm')
const nanobus = require('nanobus')

const debug = true
// window.localStorage.debug = 'webrtc-swarm'
const persist = false
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

type Message = {
  author: string,
  content: any & {
    ts: number,
  },
}

type State = {|
  key: string,
  peers: {[key: string]: number},
  messages: Array<Message>,
  following: {[key: string]: boolean},
|}

const initialState: State = {
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
function insert (messages: Array<Message>, message: Message) {
  return messages.concat([message]).sort((a, b) => {
    return (a.content.ts || 0) - (b.content.ts || 0)
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
        author: 'me',
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

class ExpandableKey extends Component<{feedKey: string}, {expanded: boolean}> {
  state = {
    expanded: false,
  }

  render () {
    const {
      feedKey
    } = this.props
    if (!feedKey) return <div>...</div>
    const prefix = feedKey.slice(0, 6)
    return (
      <div>
        <span
          style={{
            backgroundColor: `#${prefix}`,
            fontFamily: '"Roboto Mono", monospace'
          }}
          onMouseEnter={() => this.setState({expanded: true})}
          onMouseLeave={() => this.setState({expanded: false})}
        >{this.state.expanded ? feedKey : `${prefix}...`}</span>
      </div>
    )
  }
}

class App extends Component<{state: State, dispatch: any => void}, void> {
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
    this.write = message => feed.emit('write', {
      message,
      ts: +Date.now(),
    })
  }

  render() {
    const {
      key,
      peers,
      following,
      messages,
    } = this.props.state
    return (
      <div>
        <div className="profile">
          <ExpandableKey feedKey={key} />
        </div>
        <div>{JSON.stringify(following)}</div>
        <div>{JSON.stringify(peers)}</div>
        <div>{messages.map((message, i) => <div key={i}>{JSON.stringify(message)}</div>)}</div>
        <input onKeyDown={e => {e.key === 'Enter' && this.write(e.target.value)}} type="text" />
        <input onKeyDown={e => {e.key === 'Enter' && this.follow(e.target.value)}} type="text" />
      </div>
    )
  }
}

export default redux(App, reducer)
// export default () => <div>disabled</div>

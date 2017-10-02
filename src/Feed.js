// @flow
import {type EventType, type MessageType} from './types'

const hypercore = require('hypercore')
const pump = require('pump')
const idb = require('random-access-idb')
const ram = require('random-access-memory')
const signalhub = require('signalhub')
const webrtcSwarm = require('webrtc-swarm')
const nanobus = require('nanobus')

const debug = true
// window.localStorage.debug = 'webrtc-swarm'
const persist = true
const hubs = ['localhost:1337']

export default class Feed {
  key: string
  events: nanobus

  constructor (otherKey: ?string) {
    this.events = nanobus()
    if (debug) {
      this.events.on('*', (name, data) => console.log(name, data))
    }

    const feed = hypercore(
      file => persist ? idb(otherKey ? 'datter/' + otherKey : 'datter/me')(file) : ram(),
      otherKey,
      {valueEncoding: 'json'}
    )
    feed.ready(() => {
      this.key = feed.key.toString('hex')
      this.events.emit('ready', this.key)
      const hub = signalhub('datter/' + this.key, hubs)
      const swarm = webrtcSwarm(hub)
      swarm.on('peer', (peer, id) => {
        this.events.emit('peer/connect', swarm.peers.length)
        const replicate = feed.replicate({live: true})
        pump(replicate, peer, replicate, () => {
          this.events.emit('peer/disconnect', swarm.peers.length)
        })
      })

      if (feed.writable) {
        this.events.on('write', (event: EventType) => {
          feed.append(event, err => {
            if (err) console.error(err)
          })
        })
      }

      feed.createReadStream({live: true}).on('data', (event: EventType) => {
        this.events.emit('read', event)
      })
    })
  }

  onReady (listener: (key: string) => void) {
    this.events.on('ready', listener)
  }

  onPeerConnect (listener: (peerCount: number) => void) {
    this.events.on('peer/connect', listener)
  }

  onPeerDisconnect (listener: (peerCount: number) => void) {
    this.events.on('peer/disconnect', listener)
  }

  onRead (listener: (message: MessageType) => void) {
    this.events.on('read', (event: EventType) => {
      listener({
        author: this.key,
        content: event,
      })
    })
  }

  writeMessage (text: string) {
    this.events.emit('write', event('message', text))
  }

  follow (key: string) {
    this.events.emit('write', event('follow', key))
  }
}

function event (type, payload): EventType {
  return {
    type,
    payload,
    ts: +Date.now()
  }
}

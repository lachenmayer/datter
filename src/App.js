// @flow
import './App.css'
import {type MessageType} from './types'
import Feed from './Feed'
import keyToColor from './keyToColor'

import {EditableText, FocusStyleManager, InputGroup, Text} from '@blueprintjs/core'
import '@blueprintjs/core/dist/blueprint.css'
import moment from 'moment'
import React, { Component } from 'react'
import redux from 'tinyredux'

FocusStyleManager.onlyShowFocusOnTabs()

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

function reducer (state = initialState, {type, payload}) {
  switch (type) {
    case 'me/ready': {
      return u(state, {key: payload})
    }
    case 'other/ready': {
      const key = payload
      return u(state, {following: u(state.following, {[key]: true})})
    }
    case 'me/peer/connect':
    case 'me/peer/disconnect': {
      return u(state, {peers: u(state.peers, {[state.key]: payload})})
    }
    case 'other/peer/connect':
    case 'other/peer/disconnect': {
      const {key, peerCount} = payload
      return u(state, {peers: u(state.peers, {[key]: peerCount})})
    }
    case 'me/read':
    case 'other/read': {
      return u(state, {messages: insert(state.messages, payload)})
    }
    default:
  }
  return state
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

const Key = ({k, className}) => (
  <div className={`key ${className}`} style={{backgroundColor: keyToColor(k)}}>{k}</div>
)

class Message extends Component<{message: MessageType}, void> {
  render () {
    const {message: {content, author}} = this.props
    return (
      <div className="message">
        <div className="author"><Key k={author} /></div>
        <div className="content">
          {(() => {
            switch (content.type) {
              case 'message': return <Text>{content.payload}</Text>
              case 'follow': return <Text>followed <Key k={content.payload} /></Text>
              default: return <Text>
                can't handle message content:
                <pre>{JSON.stringify(content)}</pre>
              </Text>
            }
          })()}
        </div>
        <div className="timestamp">{moment(content.ts).fromNow()}</div>
      </div>
    )
  }
}

class App extends Component<{state: StateType, dispatch: any => void}, void> {
  writeMessage: (message: string) => void
  follow: (key: string) => void

  followPeer (key) {
    const {dispatch} = this.props
    const feed = new Feed(key)
    feed.onReady(key => dispatch(action('other/ready', key)))
    feed.onPeerConnect(peerCount => dispatch(action('other/peer/connect', {key, peerCount})))
    feed.onPeerDisconnect(peerCount => dispatch(action('other/peer/disconnect', {key, peerCount})))
    feed.onRead(message => dispatch(action('other/read', message)))
  }

  componentDidMount () {
    const {dispatch} = this.props
    const me = new Feed()
    me.onReady(key => dispatch(action('me/ready', key)))
    me.onPeerConnect(peerCount => dispatch(action('me/peer/connect', peerCount)))
    me.onPeerDisconnect(peerCount => dispatch(action('me/peer/disconnect', peerCount)))
    me.onRead(message => {
      if (message.content.type === 'follow') {
        this.followPeer(message.content.payload)
      }
      dispatch(action('me/read', message))
    })
    this.follow = key => {
      me.follow(key)
      this.followPeer(key)
    }
    this.writeMessage = text => me.writeMessage(text)
  }

  render() {
    const {
      key,
      peers,
      messages,
    } = this.props.state
    return (
      <div className="app">
        <Follow onFollow={this.follow} />
        <div className="profile">
          <Key k={key} />
          <Following peers={peers} />
        </div>
        <WriteMessage onSend={this.writeMessage} />
        <div>{messages.map((message, i) => <Message key={i} message={message} />)}</div>
      </div>
    )
  }
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

export default redux(App, reducer)

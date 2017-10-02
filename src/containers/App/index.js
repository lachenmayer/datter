import React, {Component} from 'react'
import {connect} from 'react-redux'
import {BrowserRouter, Route, Switch} from 'react-router-dom'

import Feed from '../../Feed'

import Home from '../Home'

import './style.css'

class App extends Component<{dispatch: any => void}, void> {
  writeMessage: (message: string) => void
  follow: (key: string) => void

  replicate (key) {
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
        this.replicate(message.content.payload)
      }
      dispatch(action('me/read', message))
    })
    this.follow = key => {
      this.replicate(key)
      me.follow(key)
    }
    this.writeMessage = text => me.writeMessage(text)
  }

  render() {
    return (
      <BrowserRouter>
        <div className="app">
          <Switch>
            <Route exact path="/" render={() => (
              <Home
                onFollow={this.follow}
                writeMessage={this.writeMessage}
              />
            )} />
          </Switch>
          {/* <Following peers={peers} /> */}
        </div>
      </BrowserRouter>
    )
  }
}

export default connect()(App)

function action (type, payload) {
  return {type, payload}
}

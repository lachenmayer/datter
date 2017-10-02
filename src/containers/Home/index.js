import React, {Component} from 'react'
import {connect} from 'react-redux'

import {type StateType} from '../../types'

import Follow from '../../components/Follow'
import Key from '../../components/Key'
import Message from '../../components/Message'
import WriteMessage from '../../components/WriteMessage'

type HomeProps = {|
  onFollow: (key: string) => void,
  writeMessage: (message: string) => void,

  feedKey: string,
  messages: Array<MessageType>,
|}

function mapStateToProps (state: StateType): HomeProps {
  return {
    feedKey: state.key,
    messages: state.messages,
  }
}

class Home extends Component<HomeProps, void> {
  render () {
    const {
      onFollow,
      writeMessage,

      feedKey,
      messages,
    } = this.props
    return (
      <div className="home">
        <Follow onFollow={onFollow} />
        <div className="profile">
          <Key k={feedKey} />
        </div>
        <WriteMessage onSend={writeMessage} />
        <div>{messages.map((message, i) => <Message key={i} message={message} />)}</div>
      </div>
    )
  }
}

export default connect(mapStateToProps)(Home)

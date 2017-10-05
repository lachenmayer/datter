import React, {Component} from 'react'
import {connect} from 'react-redux'

import Follow from '../../components/Follow'
import Key from '../../components/Key'
import Message from '../../components/Message'
import WriteMessage from '../../components/WriteMessage'

import type MessageType from '../../types'

type Props = {|
  replicate: (key: string) => void,
  writeMessage: (message: string) => void,

  me: boolean,
  feed: Array<MessageType>,
|}

function mapStateToProps (state, ownProps) {
  return {
    me: state.key === ownProps.feedKey,
    feed: state.feeds[ownProps.feedKey],
  }
}

class Profile extends Component<Props, void> {
  componentDidMount () {
    const {replicate, feedKey} = this.props
    replicate(feedKey)
  }

  componentDidUpdate (previousProps) {
    const {replicate, feedKey} = this.props
    if (feedKey !== previousProps.feedKey) {
      replicate(feedKey) // in case we are not following that key already
    }
  }

  render () {
    const {
      writeMessage,

      feedKey,
      feed,
      me,
    } = this.props
    if (!feed) {
      return <div>Loading...</div>
    }
    return (
      <div className="home">
        <div className="profile">
          <Key k={feedKey} />
        </div>
        {me ? <WriteMessage onSend={writeMessage} /> : null}
        <div>{feed.map((message, i) => <Message key={i} message={message} />)}</div>
      </div>
    )
  }
}

export default connect(mapStateToProps)(Profile)

import moment from 'moment'
import React, {Component} from 'react'
import {Text} from '@blueprintjs/core'

import Key from './Key'

export default class Message extends Component<{message: MessageType}, void> {
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

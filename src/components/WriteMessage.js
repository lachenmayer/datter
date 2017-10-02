import React, {Component} from 'react'
import {EditableText} from '@blueprintjs/core'

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

export default WriteMessage

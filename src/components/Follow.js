import React, {Component} from 'react'
import {InputGroup} from '@blueprintjs/core'

import keyToColor from '../keyToColor'

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

export default Follow

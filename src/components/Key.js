import React from 'react'

import keyToColor from '../keyToColor'

const Key = ({k}) => (
  <div className={'key'} style={{backgroundColor: keyToColor(k)}}>{k}</div>
)

export default Key

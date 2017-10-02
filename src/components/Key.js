import React from 'react'
import {Link} from 'react-router-dom'

import keyToColor from '../keyToColor'

export default ({k}) => (
  <Link to={`/profile/${k}`}>
    <div className={'key'} style={{backgroundColor: keyToColor(k)}}>{k}</div>
  </Link>
)

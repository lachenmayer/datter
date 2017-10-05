import React from 'react'

import keyToColor from '../keyToColor'

export default function Following ({peers}) {
  const keys = Object.keys(peers)
  if (keys.length < 1) {
    return <div className="following">Peers: 0</div>
  }
  return (
    <div className="following">Peers: {keys.map(key => <span key={key} title={key} style={{backgroundColor: keyToColor(key)}}>{peers[key]}</span>)}</div>
  )
}

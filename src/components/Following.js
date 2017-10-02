function Following ({peers}) {
  const keys = Object.keys(peers)
  if (keys.length < 1) {
    return <div>Peers: 0</div>
  }
  return (
    <div>Peers: {keys.map(key => <span key={key} title={key} style={{backgroundColor: keyToColor(key)}}>{peers[key]}</span>)}</div>
  )
}

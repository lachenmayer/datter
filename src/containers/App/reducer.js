import type MessageType from '../../types'

export type StateType = {|
  key: string,
  peers: {[key: string]: number},
  messages: Array<MessageType>,
  feeds: {[key: string]: Array<MessageType>},
|}

export type ActionType
  = {type: 'me/ready', payload: string /* key */}
  | {type: 'other/ready', payload: string /* key */}
  | {type: 'me/peer/connect', payload: number /* peer count */}
  | {type: 'me/peer/disconnect', payload: number /* peer count */}
  | {type: 'other/peer/connect', payload: {key: string, peerCount: number}}
  | {type: 'other/peer/disconnect', payload: {key: string, peerCount: number}}
  | {type: 'me/read', payload: MessageType}
  | {type: 'other/read', payload: MessageType}

const initialState: StateType = {
  key: '',
  peers: {},
  messages: [],
  feeds: {},
}

export default function reducer (state: StateType = initialState, action: ActionType): StateType {
  const {type, payload} = action
  switch (type) {
    case 'me/ready': {
      return u(state, {key: payload})
    }
    case 'other/ready': {
      const key = payload
      return u(state, {feeds: u(state.feeds, {[key]: []})})
    }
    case 'me/peer/connect':
    case 'me/peer/disconnect': {
      return u(state, {peers: u(state.peers, {[state.key]: payload})})
    }
    case 'other/peer/connect':
    case 'other/peer/disconnect': {
      const {key, peerCount} = payload
      return u(state, {peers: u(state.peers, {[key]: peerCount})})
    }
    case 'me/read':
    case 'other/read': {
      const feedMessages = insert(state.feeds[payload.author], payload)
      return u(state, {
        messages: insert(state.messages, payload),
        feeds: u(state.feeds, {[payload.author]: feedMessages})
      })
    }
    default:
      (action: empty)
      return state
  }
  return state
}

function u (...updates) {
  return Object.assign({}, ...updates)
}

// Add a new message to the feed, ordering by timestamp
function insert (messages: Array<MessageType> = [], message: MessageType) {
  return messages.concat([message]).sort((a, b) => {
    return (b.content.ts || 0) - (a.content.ts || 0)
  })
}

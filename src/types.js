export type ActionType = {
  type: string,
  payload: any,
}

export type EventType = ActionType & {
  ts: number
}

export type MessageType = {
  author: string,
  content: EventType
}

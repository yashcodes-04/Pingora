export const SOCKET_EVENTS = {
  // Connection / Presence
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',

  // Direct 1-on-1 Chat
  CHAT_JOIN_CONVERSATION: 'chat:join',
  CHAT_LEAVE_CONVERSATION: 'chat:leave',
  CHAT_SEND_MESSAGE: 'chat:send_message',
  CHAT_NEW_MESSAGE: 'chat:new_message',
  CHAT_MESSAGE_DELIVERED: 'chat:message_delivered',
  CHAT_MESSAGE_READ: 'chat:message_read',
  CHAT_TYPING_START: 'chat:typing_start',
  CHAT_TYPING_STOP: 'chat:typing_stop',

  // Public Community Chat
  PUBLIC_JOIN: 'public:join',
  PUBLIC_LEAVE: 'public:leave',
  PUBLIC_SEND_MESSAGE: 'public:send_message',
  PUBLIC_NEW_MESSAGE: 'public:new_message',
  PUBLIC_MESSAGE_DELETED: 'public:message_deleted',

  // Errors / System
  SYSTEM_ERROR: 'system:error'
} as const;


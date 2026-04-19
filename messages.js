import { DB } from './db';
import { uid, now, getChatId } from '../utils/helpers';

export const Messages = {
  send(senderId, receiverId, text) {
    const msg = {
      id: uid(),
      text,
      senderId,
      receiverId,
      chatId: getChatId(senderId, receiverId),
      timestamp: now(),
      vanished: false,
    };
    DB.messages.push(msg);
    return msg;
  },

  getChat(userA, userB) {
    const chatId = getChatId(userA, userB);
    return DB.messages
      .filter((m) => m.chatId === chatId && !m.vanished)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-50);
  },

  vanishChat(userA, userB) {
    const chatId = getChatId(userA, userB);
    DB.messages.forEach((m) => {
      if (m.chatId === chatId) m.vanished = true;
    });
  },

  getLastMessage(userA, userB) {
    const chatId = getChatId(userA, userB);
    const msgs = DB.messages
      .filter((m) => m.chatId === chatId && !m.vanished)
      .sort((a, b) => b.timestamp - a.timestamp);
    return msgs[0] || null;
  },
};

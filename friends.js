import { DB } from './db';
import { uid, now } from '../utils/helpers';

export const Friends = {
  send(fromId, toId) {
    const exists = DB.friendRequests.find(
      (r) =>
        (r.fromId === fromId && r.toId === toId) ||
        (r.fromId === toId && r.toId === fromId)
    );
    if (exists) return exists;
    const req = { id: uid(), fromId, toId, status: 'pending', createdAt: now() };
    DB.friendRequests.push(req);
    return req;
  },

  accept(reqId) {
    const r = DB.friendRequests.find((r) => r.id === reqId);
    if (r) r.status = 'accepted';
  },

  reject(reqId) {
    const r = DB.friendRequests.find((r) => r.id === reqId);
    if (r) r.status = 'rejected';
  },

  getStatus(userA, userB) {
    return (
      DB.friendRequests.find(
        (r) =>
          (r.fromId === userA && r.toId === userB) ||
          (r.fromId === userB && r.toId === userA)
      ) || null
    );
  },

  isFriend(userA, userB) {
    const r = DB.friendRequests.find(
      (r) =>
        ((r.fromId === userA && r.toId === userB) ||
          (r.fromId === userB && r.toId === userA)) &&
        r.status === 'accepted'
    );
    return !!r;
  },

  pendingIncoming(userId) {
    return DB.friendRequests.filter(
      (r) => r.toId === userId && r.status === 'pending'
    );
  },

  pendingSent(userId) {
    return DB.friendRequests.filter(
      (r) => r.fromId === userId && r.status === 'pending'
    );
  },
};

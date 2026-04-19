import { DB } from './db';
import { uid, now, fmtDate } from '../utils/helpers';

export const Auth = {
  signup(name, email, password) {
    if (DB.users.find((u) => u.email === email.toLowerCase())) {
      return { error: 'Email already registered' };
    }
    const user = {
      id: uid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      photo: null,
      bio: '',
      createdAt: now(),
    };
    DB.users.push(user);
    DB.onlineStatus[user.id] = now();
    DB.privacySettings[user.id] = {
      showOnline: true,
      showPhoto: true,
      showBio: true,
      lastSeen: true,
    };
    return { user };
  },

  login(email, password) {
    const user = DB.users.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );
    if (!user) return { error: 'Invalid email or password' };
    DB.onlineStatus[user.id] = now();
    return { user };
  },

  updateOnline(userId) {
    DB.onlineStatus[userId] = now();
  },

  isOnline(userId) {
    const last = DB.onlineStatus[userId];
    return !!last && now() - last < 30000;
  },

  lastSeen(userId) {
    const last = DB.onlineStatus[userId];
    if (!last) return 'Never';
    const diff = now() - last;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return fmtDate(last);
  },

  updateProfile(userId, { name, bio, photo }) {
    const idx = DB.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      DB.users[idx] = { ...DB.users[idx], name, bio, photo };
      return DB.users[idx];
    }
    return null;
  },

  updatePrivacy(userId, settings) {
    DB.privacySettings[userId] = { ...DB.privacySettings[userId], ...settings };
  },

  getPrivacy(userId) {
    return DB.privacySettings[userId] || {
      showOnline: true, showPhoto: true, showBio: true, lastSeen: true,
    };
  },
};

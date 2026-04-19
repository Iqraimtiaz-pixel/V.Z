// ============================================================
// VibeZ In-Memory Database
// Persists across re-renders via window.__vibezDB
// ============================================================

if (!window.__vibezDB) {
  window.__vibezDB = {
    users: [],
    messages: [],
    friendRequests: [],
    onlineStatus: {},
    privacySettings: {},
  };
}

export const DB = window.__vibezDB;

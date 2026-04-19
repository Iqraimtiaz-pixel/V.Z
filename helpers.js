export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = () => Date.now();

export const getChatId = (a, b) => [a, b].sort().join('__');

export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const fmtDate = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const avatarColor = (name = '?') => {
  const colors = ['#7C3AED', '#6D28D9', '#5B21B6', '#8B5CF6', '#A78BFA', '#4C1D95'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

export const getInitials = (name = '?') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎',
  '❤️','🔥','✨','🎉','💯','🙏','👀','💪','😭','🤣',
  '😊','😏','🥺','😴','🤗','💀','👋','🎊','🌟','💫',
  '⚡','🎯','🌈','💎','🚀','🍕','🎮','🏆','💰','🌸',
];

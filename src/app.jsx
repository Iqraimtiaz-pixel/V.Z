import { useState } from 'react';
import AuthScreen from './screens/AuthScreen';
import UsersListScreen from './screens/UsersListScreen';
import ChatScreen from './screens/ChatScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chatWith, setChatWith] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setChatWith(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setChatWith(null);
  };

  const handleOpenChat = (user) => {
    setChatWith(user);
  };

  const handleCloseChat = () => {
    setChatWith(null);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (chatWith) {
    return (
      <ChatScreen
        currentUser={currentUser}
        otherUser={chatWith}
        onBack={handleCloseChat}
      />
    );
  }

  return (
    <UsersListScreen
      currentUser={currentUser}
      onOpenChat={handleOpenChat}
      onLogout={handleLogout}
    />
  );
}

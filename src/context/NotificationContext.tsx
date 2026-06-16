import React, { createContext, useContext } from 'react';
import { Alert, Vibration } from 'react-native';

interface NotificationContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showInfo: (msg: string) => void;
  showWarning: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alert = (title: string, msg: string) => {
    Alert.alert(title, msg);
    Vibration.vibrate(100);
  };

  return (
    <NotificationContext.Provider
      value={{
        showSuccess: (msg) => alert('Succès', msg),
        showError: (msg) => alert('Erreur', msg),
        showInfo: (msg) => alert('Info', msg),
        showWarning: (msg) => alert('Attention', msg),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
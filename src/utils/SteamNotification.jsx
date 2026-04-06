'use client'

import { useState, useEffect } from 'react';
import './SteamNotification.css';

// Global notification manager
class SteamNotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(message, title = 'Success', type = 'success') {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      title,
      message,
      type,
      timestamp: Date.now()
    };

    this.notifications = [notification, ...this.notifications].slice(0, 5); // Keep max 5
    this.listeners.forEach(listener => listener([...this.notifications]));

    // Auto remove after 4 seconds
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

export const steamNotificationManager = new SteamNotificationManager();

// Helper functions
export const showSteamNotification = (message, title = 'Success', type = 'success') => {
  steamNotificationManager.notify(message, title, type);
};

export const showSteamSuccess = (message, title = 'Success') => {
  showSteamNotification(message, title, 'success');
};

export const showSteamError = (message, title = 'Error') => {
  showSteamNotification(message, title, 'error');
};

// Steam Notification Component - Add this to your app layout
export function SteamNotificationContainer() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = steamNotificationManager.addListener(setNotifications);
    return unsubscribe;
  }, []);

  const handleDismiss = (id) => {
    steamNotificationManager.remove(id);
  };

  return (
    <div className="steam-notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`steam-notification ${notification.type}`}
          onClick={() => handleDismiss(notification.id)}
        >
          <div className="steam-notification-header">
            <span className="steam-notification-title">{notification.title}</span>
            <button
              className="steam-notification-close"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(notification.id);
              }}
            >
              ×
            </button>
          </div>
          <div className="steam-notification-message">
            {notification.message}
          </div>
        </div>
      ))}
    </div>
  );
}

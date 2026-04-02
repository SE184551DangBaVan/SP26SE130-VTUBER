import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Change this to your Azure backend URL when deploying
const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net";
// const API_BASE_URL = "http://localhost:8080";

let stompClient = null;

export const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        console.warn("No auth token found for WebSocket connection");
        reject(new Error("No auth token"));
        return;
      }

      const socketFn = () => {
        return new SockJS(`${API_BASE_URL}/ws-chat?token=${token}`);
      };

      stompClient = new Client({
        webSocketFactory: socketFn,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      stompClient.onConnect = (frame) => {
        resolve(stompClient);
      };

      stompClient.onStompError = (frame) => {
        console.error("✗ STOMP ERROR:", frame);
        console.error("Error headers:", frame.headers);
        reject(new Error(frame.headers.message || "STOMP error"));
      };

      stompClient.onWebSocketError = (error) => {
        console.error("✗ WebSocket ERROR:", error);
        reject(error);
      };

      stompClient.onDisconnect = (frame) => {
      };

      stompClient.onWebSocketClose = (evt) => {
      };

      stompClient.activate();
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      reject(error);
    }
  });
};
export const subscribeToMessages = (onMessage) => {
  if (!stompClient || !stompClient.connected) {
    console.warn("WebSocket not connected - cannot subscribe");
    return null;
  }
    const username = sessionStorage.getItem("username") || localStorage.getItem("username");
    if (!username) {
        console.warn("No username found for message subscribing");
        return;
    }

  const userSubscription = stompClient.subscribe(`/queue/reply/${username}`, (message) => {
    try {
      const parsedMessage = JSON.parse(message.body);
      onMessage(parsedMessage);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  return {
    unsubscribe: () => {
      userSubscription.unsubscribe();
    }
  };
};

export const sendWebSocketMessage = (messageData) => {
  return new Promise((resolve, reject) => {
    if (!stompClient || !stompClient.connected) {
      console.error("Cannot send: WebSocket not connected");
      reject(new Error("WebSocket not connected"));
      return;
    }

    try {
      stompClient.publish({
        destination: "/app/chat/sendMessage",
        body: JSON.stringify(messageData)
      });
      resolve({ success: true });
    } catch (error) {
      console.error("✗ Error publishing message:", error);
      reject(error);
    }
  });
};

/**
 * Disconnect from WebSocket
 */
export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

export const isWebSocketConnected = () => {
  return stompClient !== null && stompClient.connected;
};

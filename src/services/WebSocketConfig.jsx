import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Change this to your Azure backend URL when deploying
// const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net";
const API_BASE_URL = "http://localhost:8080";

let stompClient = null;

/**
 * Connect to WebSocket server using SockJS
 * @returns {Promise<Client>} STOMP client instance
 */
export const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      // Get auth token
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        console.warn("No auth token found for WebSocket connection");
        reject(new Error("No auth token"));
        return;
      }

      // Create SockJS connection - SockJS doesn't support custom headers in handshake
      // Token must be passed as query parameter for authentication
      const socketFn = () => {
        // Pass token as query parameter (backend's WebSocketAuthInterceptor checks for this)
        return new SockJS(`${API_BASE_URL}/ws-chat?token=${token}`);
      };

      // Create STOMP client over SockJS
      stompClient = new Client({
        webSocketFactory: socketFn,
        // Note: connectHeaders won't be sent during SockJS handshake
        // They're only sent in STOMP CONNECT frame after WebSocket is established
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          // Enable debugging to see what's happening
          console.log('STOMP Debug: ', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      stompClient.onConnect = (frame) => {
        console.log("✓ WebSocket connected:", frame);
        resolve(stompClient);
      };

      stompClient.onStompError = (frame) => {
        console.error("✗ STOMP error:", frame);
        reject(new Error(frame.headers.message || "STOMP error"));
      };

      stompClient.onWebSocketError = (error) => {
        console.error("✗ WebSocket error:", error);
        reject(error);
      };

      stompClient.onDisconnect = (frame) => {
        console.log("✗ WebSocket disconnected:", frame);
      };

      stompClient.onWebSocketClose = (evt) => {
        console.error("✗ WebSocket close event - Code:", evt.code, "Reason:", evt.reason);
      };

      stompClient.activate();
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      reject(error);
    }
  });
};

/**
 * Subscribe to chat messages queue
 * @param {Function} onMessage - Callback function for incoming messages
 * @returns {Subscription} STOMP subscription
 */
export const subscribeToMessages = (onMessage) => {
  if (!stompClient || !stompClient.connected) {
    console.warn("WebSocket not connected");
    return null;
  }

  // Subscribe to user-specific queue
  const userSubscription = stompClient.subscribe("/user/queue/reply", (message) => {
    try {
      const parsedMessage = JSON.parse(message.body);
      console.log("Received WebSocket message from /user/queue/reply:", parsedMessage);
      console.log("Message destination:", message.destination);
      onMessage(parsedMessage);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  // Also subscribe to public queue as fallback
  const publicSubscription = stompClient.subscribe("/queue/reply", (message) => {
    try {
      const parsedMessage = JSON.parse(message.body);
      console.log("Received WebSocket message from /queue/reply:", parsedMessage);
      console.log("Message destination:", message.destination);
      onMessage(parsedMessage);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  console.log("Subscribed to /user/queue/reply and /queue/reply");
  
  // Return an object that can unsubscribe both
  return {
    unsubscribe: () => {
      userSubscription.unsubscribe();
      publicSubscription.unsubscribe();
    }
  };
};

/**
 * Send a chat message via WebSocket
 * @param {Object} messageData - Message data (content, etc.)
 * @returns {Promise<Object>} Result of the operation
 */
export const sendWebSocketMessage = (messageData) => {
  return new Promise((resolve, reject) => {
    if (!stompClient || !stompClient.connected) {
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
      console.error("Error sending WebSocket message:", error);
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

/**
 * Check if WebSocket is connected
 * @returns {boolean} Connection status
 */
export const isWebSocketConnected = () => {
  return stompClient !== null && stompClient.connected;
};

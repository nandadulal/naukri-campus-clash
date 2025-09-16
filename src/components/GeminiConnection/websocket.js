/**
 * WebSocketClient class for managing WebSocket connections
 * @class
 * @param {string} url - The URL of the WebSocket server
 * @param {Object} options - Optional configuration for the WebSocket connection
 */

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 2,
      reconnectionResetInterval: 40000,
      onCloseCB: () => {},
      onOpenCB: () => {},
      onReconnectCB: () => {},
      errorCB: () => {},
      ...options,
    };
    this.ws = null;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Set();
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.reconnectResetTimeout = null;
  }

  /**
   * Connects to the WebSocket server
   */
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      if (this.options.errorCB) {
        this.options.errorCB('wsConnectionError', error);
      }
    }
  }

  /**
   * Sets up event listeners for the WebSocket connection
   */
  setupEventListeners() {
    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectResetTimeout = setTimeout(() => {
        this.reconnectAttempts = 0;
      }, this.options.reconnectionResetInterval);
      if (this.options.onOpenCB) {
        this.options.onOpenCB();
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      clearTimeout(this.reconnectResetTimeout);
      if (this.options.onCloseCB) {
        this.options.onCloseCB();
      }
    };

    this.ws.onerror = error => {
      if (this.options.errorCB) {
        this.options.errorCB('wsError', error);
      }
      this.isConnected = false;
    };

    this.ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      } catch (error) {
        if (this.options.errorCB) {
          this.options.errorCB('messageError', error);
        }
      }
    };
  }

  /**
   * Handles reconnection attempts
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
      if (this.options.onReconnectCB) {
        this.options.onReconnectCB();
      }
    } else if (this.options.errorCB) {
      this.options.errorCB(
        'reconnectError',
        'Max reconnection attempts reached'
      );
    }
  }

  /**
   * Disconnects from the WebSocket server
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.reconnectResetTimeout) {
      clearTimeout(this.reconnectResetTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Sends a message to the WebSocket server
   * @param {string|Object} message - The message to send
   */
  send(message) {
    if (!this.isConnected) {
      if (this.options.errorCB) {
        this.options.errorCB('sendMessageError', 'WebSocket is not connected');
      }
      return;
    }

    try {
      const data =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(data);
    } catch (error) {
      if (this.options.errorCB) {
        this.options.errorCB('sendMessageError', error);
      }
    }
  }

  /**
   * Adds a message handler to the WebSocket client
   * @param {Function} handler - The handler function to add
   * @returns {Function} - A function to remove the handler
   */
  onMessageCBHandler(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Gets the connection status of the WebSocket client
   * @returns {boolean} - True if the connection is active, false otherwise
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default WebSocketClient;

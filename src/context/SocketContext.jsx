import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import { SOCKET_URL } from "global/config";
import { showUserData, showToken } from "../store/slices/uniqueSlice";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};

export const SocketProvider = ({ children }) => {
  const userData = useSelector(showUserData);
  const token = useSelector(showToken);

  const userId = userData?.user_id?._id || null;

  // ------------------ STATE ------------------
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // ------------------ REFS ------------------
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pongReceivedRef = useRef(false);
  const pingPongTimeoutRef = useRef(null);
  const initializeSocketRef = useRef(null);

  // ------------------ SYNC REFS ------------------
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // ------------------ PING PONG CLEANUP ------------------
  const cleanupPingPong = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pingPongTimeoutRef.current) {
      clearTimeout(pingPongTimeoutRef.current);
      pingPongTimeoutRef.current = null;
    }
    pongReceivedRef.current = false;
  }, []);

  // ------------------ PING PONG MECHANISM ------------------
  const setupPingPongMechanism = useCallback(() => {
    if (!socket || !isConnected) return;

    // Cleanup any existing ping-pong mechanism
    cleanupPingPong();

    // Setup pong listener
    const handlePong = () => {
      pongReceivedRef.current = true;

      // Clear the timeout since we received pong
      if (pingPongTimeoutRef.current) {
        clearTimeout(pingPongTimeoutRef.current);
        pingPongTimeoutRef.current = null;
      }
    };

    socket.on("pong", handlePong);

    // Start ping interval - emit ping every 5 seconds
    pingIntervalRef.current = setInterval(() => {
      const currentSocket = socketRef.current;
      if (!currentSocket || !currentSocket.connected) {
        console.warn("⚠️ Socket not connected, skipping ping");
        cleanupPingPong();
        return;
      }

      // Reset pong flag before sending ping
      pongReceivedRef.current = false;

      // Emit ping
      currentSocket.emit("ping");

      // Set timeout to check if pong is received within 3 seconds
      pingPongTimeoutRef.current = setTimeout(() => {
        if (!pongReceivedRef.current) {
          console.warn("⚠️ Pong not received, socket may be disconnected. Reconnecting...");

          // Cleanup current socket
          cleanupPingPong();
          if (currentSocket) {
            currentSocket.off("pong", handlePong);
            currentSocket.disconnect();
          }

          // Reset socket state
          setSocket(null);
          setIsConnected(false);

          // Reconnect socket
          setTimeout(() => {
            if (initializeSocketRef.current) {
              initializeSocketRef.current();
            }
          }, 1000);
        }
      }, 3000); // Wait 3 seconds for pong response
    }, 5000); // Ping every 5 seconds

    // Return cleanup function
    return () => {
      if (socket) {
        socket.off("pong", handlePong);
      }
      cleanupPingPong();
    };
  }, [socket, isConnected, cleanupPingPong]);

  // ------------------ INITIALIZE SOCKET ------------------
  const initializeSocket = useCallback(async () => {
    if (isInitializing || socket) return;

    // Check if SOCKET_URL is available
    if (!SOCKET_URL) {
      console.warn(
        "SOCKET_URL is not defined. Socket connection will not be established."
      );
      setIsInitializing(false);
      return;
    }

    // Require auth token before initializing socket
    if (!token) {
      setIsInitializing(false);
      return;
    }

    // Require user id
    if (!userId) {
      console.warn("Socket init skipped: userId not ready yet.");
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);

    try {
      // Import socket.io-client dynamically
      const { io } = await import("socket.io-client");

      const connectionUrl = userId ? `${SOCKET_URL}?user_id=${userId}` : SOCKET_URL;

      const newSocket = io(connectionUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        timeout: 10000,
      });

      // Connection events
      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("⚠️ Socket disconnected");
        setIsConnected(false);
        cleanupPingPong();
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("❌ Error initializing socket:", error);
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [userId, token, isInitializing, socket, cleanupPingPong]);

  // Sync initializeSocket ref
  useEffect(() => {
    initializeSocketRef.current = initializeSocket;
  }, [initializeSocket]);

  // Initialize socket when token and userId are available (after login)
  useEffect(() => {
    // Initialize socket only when token and user id are available (post-login)
    if (!token || !userId) return;
    if (!socket && !isInitializing) initializeSocket();
  }, [token, userId, socket, isInitializing, initializeSocket]);

  // Start ping-pong mechanism when socket connects
  useEffect(() => {
    if (socket && isConnected) {
      const cleanup = setupPingPongMechanism();
      return cleanup;
    }
  }, [socket, isConnected, setupPingPongMechanism]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPingPong();
      if (socket) {
        socket.disconnect();
        console.log("SocketProvider unmounted → socket disconnected");
      }
    };
  }, [socket, cleanupPingPong]);

  // ------------------ EMITTER UTILITY ------------------
  const emitEvent = useCallback((eventName, data, callback) => {
    if (!socket) return console.error(`❌ No socket instance for ${eventName}`);
    if (!isConnected) return console.error(`⚠️ Socket not connected → cannot emit ${eventName}`);

    try {
      socket.emit(eventName, data, (response, errorCode) => {
        if (callback && typeof callback === "function") callback(response, errorCode);
      });
    } catch (error) {
      console.error(`❌ Error emitting ${eventName}:`, error);
      if (callback && typeof callback === "function") callback(null, error);
    }
  }, [socket, isConnected]);

  const ping = () => emitEvent("ping");
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const onPong = (callback) => socket?.on("pong", callback);

  // ------------------ PROVIDER ------------------
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        ping,
        onPong,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

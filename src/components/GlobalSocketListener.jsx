import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext";
import { updateChatListWithNewMessage, fetchChatGetAll } from "../store/slices/chatSlice";
import { showUserData } from "../store/slices/uniqueSlice";
import { showChatList } from "../store/slices/chatSlice";

const GlobalSocketListener = () => {
  const dispatch = useDispatch();
  const { socket, isConnected,ping } = useSocket();
  const userData = useSelector(showUserData);
  const chatList = useSelector(showChatList);
  const location = useLocation();

  // Ensure chat list is fetched globally and only once
  const fetchedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  // Reset fetch flag when user changes (handles logout/login without hard refresh)
  useEffect(() => {
    const currentUserId = userData?.user_id?._id || userData?._id || null;
    if (currentUserId !== lastUserIdRef.current) {
      fetchedRef.current = false;
      lastUserIdRef.current = currentUserId;
    }
  }, [userData]);
  useEffect(() => {
    if (!isConnected || !userData) return;
    if (Array.isArray(chatList) && chatList.length > 0) return;
    if (fetchedRef.current) return;

      dispatch(fetchChatGetAll({ is_admin: true }));
      fetchedRef.current = true;
  }, [isConnected, userData, chatList, dispatch]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("✅ GlobalSocketListener active for socket:", socket.id);

    const getCurrentUserId = () => userData?.user_id?._id || userData?._id;

    const handleNewMessage = (messageData) => {
      const currentUserId = getCurrentUserId();
      console.log("🌐 new_message event:", messageData);
      // Ensure chat list contains this chat; if not, fetch list to populate unread counts
      const messageChatNodeId = messageData.chatNodeId || messageData.chat_node_id;
      const exists = Array.isArray(chatList)
        && chatList.some((c) => c._id === messageChatNodeId || c.id === messageChatNodeId);
      if (!exists) {
        dispatch(fetchChatGetAll({ is_admin: true }));
      }
      dispatch(updateChatListWithNewMessage({ messageData, currentUserId }));
    };

    const handleChatMessageReceive = (messageData) => {
      const currentUserId = getCurrentUserId();
      console.log("📩 message received:", messageData);
      const messageChatNodeId = messageData.chatNodeId || messageData.chat_node_id;
      const exists = Array.isArray(chatList)
        && chatList.some((c) => c._id === messageChatNodeId || c.id === messageChatNodeId);
      if (!exists) {
        dispatch(fetchChatGetAll({ is_admin: true }));
      }
      dispatch(updateChatListWithNewMessage({ messageData, currentUserId }));
    };

    const handlePong = () => {
      // console.log("🏓 Received pong from server");
    };

    // Attach listeners without wiping others
    socket.on("new_message", handleNewMessage);
    socket.on("chatMessageReceive", handleChatMessageReceive);
    socket.on("pong", handlePong);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("chatMessageReceive", handleChatMessageReceive);
      socket.off("pong", handlePong);
    };
  }, [socket, isConnected, userData, dispatch, location.pathname, chatList]);
  
   // Ping server every 5 minutes to keep connection alive
   useEffect(() => {
    if (!isConnected || !ping) return;

    console.log("🏓 Setting up ping interval (every 5 minutes)");
    
    // Send initial ping
    ping();

    // Set up interval to ping every 5 minutes (300000 milliseconds)
    const pingInterval = setInterval(() => {
      if (isConnected) {
        ping();
      }
    }, 500); // 5 seconds

    return () => {
      clearInterval(pingInterval);
      console.log("🏓 Ping interval cleared");
    };
  }, [isConnected, ping]);

  // This component doesn't render anything
  return null;
};

export default GlobalSocketListener;

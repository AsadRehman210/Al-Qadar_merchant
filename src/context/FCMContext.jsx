import { createContext, useContext, useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../../firebaseConfig";
import { FIREBASE_VAPID_KEY } from "../global/config";
import { toast } from "react-toastify";

// Create context
const FCMContext = createContext();

// Hook to use FCM token
export function useFCM() {
  return useContext(FCMContext);
}

// Provider component
export function FCMProvider({ children }) {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const requestFcmToken = async () => {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission not granted");
        }

        // Get FCM token using VAPID key from config
        const token = await getToken(messaging, {
          vapidKey: FIREBASE_VAPID_KEY,
        });

        if (token) {
          console.log("FCM Token:", token);
          setFcmToken(token);
        } else {
          console.warn("No FCM token retrieved");
        }
      } catch (err) {
        console.error("FCM token error:", err.message || err);
        setFcmToken(null);
      }
    };

    requestFcmToken();

    // Set up foreground message handler
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Received foreground message:", payload);

      // Show toast notification
      toast.info(
        <div>
          <h4>{payload.notification?.title || "New Notification"}</h4>
          <p>{payload.notification?.body || ""}</p>
        </div>,
        {
          position: "top-right",
          autoClose: 7000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  return (
    <FCMContext.Provider value={{ fcmToken }}>{children}</FCMContext.Provider>
  );
}

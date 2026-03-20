import { useEffect } from "react";
import { messaging, requestForToken } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/contexts/NotificationContext";

export const FirebaseTokenManager = () => {
    const { isAuthenticated, user } = useAuth();
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (isAuthenticated && user) {
            const setupNotifications = async () => {
                // Request permission and get token
                const token = await requestForToken();
                if (token) {
                    try {
                        // Send token to backend
                        await api.put("/user/fcm-token", { fcm_token: token });
                        console.log("FCM Token registered with backend");
                    } catch (error) {
                        console.error("Failed to register FCM token with backend", error);
                    }
                }
            };
            setupNotifications();
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            
            const title = payload.notification?.title || "New Notification";
            const body = payload.notification?.body || "A new update has been received.";
            
            // Add to persistent notification state
            addNotification(title, body, payload.data);

            toast.info(title, {
                description: body,
                duration: 10000,
            });
        });

        return () => unsubscribe();
    }, [addNotification]);

    return null;
};

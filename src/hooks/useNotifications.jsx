'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
    getUnreadNotifications, 
    getAllNotifications,
    getUnreadNotificationCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
} from '@/services/NotificationController';
import { showSteamNotification } from '@/utils/SteamNotification';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const useNotifications = (userAuth) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState('unread'); // 'unread' or 'all'
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 15;
    const abortControllerRef = useRef(null);

    const fetchNotifications = useCallback(async (reset = false) => {
        if (!userAuth) return;
        
        if (reset) {
            setLoading(true);
            setHasMore(true);
            // We don't reset page here immediately to avoid dependency loops, 
            // we'll handle it inside the fetch logic
        } else {
            setLoadingMore(true);
        }

        try {
            // Use a functional update or local variable to get the current page value without depending on it
            let pageToFetch = 0;
            setPage(prevPage => {
                pageToFetch = reset ? 0 : prevPage;
                return prevPage;
            });

            const fetchMethod = filter === 'unread' ? getUnreadNotifications : getAllNotifications;
            const [notifRes, countRes] = await Promise.all([
                fetchMethod(pageToFetch, pageSize),
                getUnreadNotificationCount()
            ]);

            if (notifRes.success) {
                const newNotifs = notifRes.data || [];
                if (reset) {
                    setNotifications(newNotifs);
                    setPage(1);
                } else {
                    setNotifications(prev => [...prev, ...newNotifs]);
                    setPage(prev => prev + 1);
                }
                
                setHasMore(newNotifs.length === pageSize);
            }
            if (countRes.success) {
                setUnreadCount(countRes.data || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userAuth, filter]); // Removed 'page' dependency

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchNotifications(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const res = await markAsRead(notificationId);
            if (res.success) {
                if (filter === 'unread') {
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
                } else {
                    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
                }
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await markAllAsRead();
            if (res.success) {
                if (filter === 'unread') {
                    setNotifications([]);
                } else {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }
                setUnreadCount(0);
                showSteamNotification("All notifications marked as read", "Notifications");
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            const res = await deleteNotification(notificationId);
            if (res.success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setUnreadCount(prev => {
                    const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead);
                    return wasUnread ? Math.max(0, prev - 1) : prev;
                });
                showSteamNotification("Notification deleted", "System", "success");
            }
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    // Initial fetch and fetch on filter change
    useEffect(() => {
        if (userAuth) {
            fetchNotifications(true);
        }
    }, [userAuth, filter, fetchNotifications]);

    // SSE Setup using fetchEventSource for header support
    useEffect(() => {
        if (!userAuth) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            return;
        }

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return;

        const baseUrl = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";
        const sseUrl = `${baseUrl}/notifications/stream`; 
        
        const ctrl = new AbortController();
        abortControllerRef.current = ctrl;

        const setupSSE = async () => {
            try {
                await fetchEventSource(sseUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'text/event-stream',
                    },
                    signal: ctrl.signal,
                    onmessage(event) {
                        if (event.event === 'notification') {
                            try {
                                const data = JSON.parse(event.data);
                                console.log("Real-time notification received:", data);

                                setNotifications(prev => [data, ...prev].slice(0, 25));
                                setUnreadCount(prev => prev + 1);
                                showSteamNotification(data.message, data.title || "New Notification", "success");
                            } catch (parseError) {
                                console.error("Error parsing SSE data:", parseError);
                            }
                        }
                    },
                    onopen(res) {
                        if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
                            console.log("SSE Connection established");
                        }
                    },
                    onerror(err) {
                        console.error("SSE fetch error:", err);
                        // Reconnection is handled automatically by fetch-event-source
                    }
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("SSE setup error:", err);
                }
            }
        };

        setupSSE();

        return () => {
            if (ctrl) ctrl.abort();
        };
    }, [userAuth?.userId]); // Only reconnect if user identity changes


    return {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        filter,
        setFilter,
        hasMore,
        handleLoadMore,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDelete,
        refresh: () => fetchNotifications(true)
    };
};

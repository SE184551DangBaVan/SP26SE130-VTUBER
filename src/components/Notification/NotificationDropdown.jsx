'use client';

import React from 'react';
import './NotificationDropdown.css';
import { NotificationsOffOutlined, DoneAllOutlined, DeleteOutline } from '@mui/icons-material';

const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return new Date(date).toLocaleDateString();
};

const NotificationDropdown = ({ 
    notifications = [], 
    onMarkAllAsRead, 
    onDelete, 
    onNotificationClick,
    filter,
    onFilterChange,
    hasMore,
    onLoadMore,
    loadingMore
}) => {
    const truncateText = (text, maxLength = 100) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    return (
        <div className="dropdown-menu notification-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
                <h3>Notifications</h3>
                <div className="notification-header-actions">
                    <div className="notification-filter">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => onFilterChange('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => onFilterChange('unread')}
                        >
                            Unread
                        </button>
                    </div>
                    {notifications.length > 0 && (
                        <button 
                            className="mark-all-read-icon-btn" 
                            onClick={onMarkAllAsRead}
                            title="Mark all as read"
                        >
                            <DoneAllOutlined style={{ fontSize: 20 }} />
                        </button>
                    )}
                </div>
            </div>

            <div className="notification-list">
                {notifications.length > 0 ? (
                    <>
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                onClick={() => onNotificationClick(notif)}
                            >
                                <img 
                                    src={notif.triggeredByAvatarUrl || "/profile-pic-undefined.jpg"} 
                                    alt="Triggered By" 
                                    className="notification-avatar"
                                />
                                <div className="notification-content">
                                    <div className="notification-title">{notif.title}</div>
                                    <div className="notification-message">
                                        {truncateText(notif.message, 150)}
                                    </div>
                                    <div className="notification-time">
                                        {formatTimeAgo(notif.createdAt)}
                                    </div>
                                </div>
                                <button 
                                    className="delete-notification-btn" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(notif.id);
                                    }}
                                    title="Delete notification"
                                >
                                    <DeleteOutline style={{ fontSize: 18 }} />
                                </button>
                            </div>
                        ))}
                        <div className="notification-load-more-container">
                            {hasMore ? (
                                <button 
                                    className="load-more-link" 
                                    onClick={onLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? "Loading..." : "Load more"}
                                </button>
                            ) : (
                                <span className="no-more-notifications">That's all the notification!</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-notifications">
                        <NotificationsOffOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        <p>No notifications yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;

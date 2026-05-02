"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getPostReportsCount, getPendingPostsCount } from "@/services/PostController";
import { getMemberReportsCount, getPendingMembersCount } from "@/services/MemberController";

const HubModerationContext = createContext();

export const useHubModeration = () => {
  const context = useContext(HubModerationContext);
  if (!context) {
    throw new Error("useHubModeration must be used within a HubModerationProvider");
  }
  return context;
};

export const HubModerationProvider = ({ children, fanHubId }) => {
  const [counts, setCounts] = useState({
    postReports: 0,
    pendingPosts: 0,
    memberReports: 0,
    pendingMembers: 0,
  });
  const [loading, setLoading] = useState(false);

  const refreshCounts = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [postReports, pendingPosts, memberReports, pendingMembers] = await Promise.all([
        getPostReportsCount(id),
        getPendingPostsCount(id),
        getMemberReportsCount(id),
        getPendingMembersCount(id),
      ]);

      setCounts({
        postReports,
        pendingPosts,
        memberReports,
        pendingMembers,
      });
    } catch (error) {
      console.error("Error refreshing moderation counts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fanHubId) {
      refreshCounts(fanHubId);
    }
  }, [fanHubId, refreshCounts]);

  const value = {
    counts,
    loading,
    refreshCounts: () => refreshCounts(fanHubId),
  };

  return (
    <HubModerationContext.Provider value={value}>
      {children}
    </HubModerationContext.Provider>
  );
};

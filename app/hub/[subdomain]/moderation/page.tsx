"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserLayout from "@/components/UserLayout/UserLayout";
import HubModerationPage from '@/views/Users/HubModerationPage/HubModerationPage';
import { checkIsMember, getFanHubBySubdomain } from "@/services/FanHubController";

export default function HubPostsModerationRoute() {
    const params = useParams();
    const router = useRouter();
    const subdomain = params?.subdomain as string;
    const [fanHubId, setFanHubId] = useState<number | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchHubAndCheckAuth = async () => {
            if (!subdomain) {
                setIsAuthorized(false);
                return;
            }

            try {
                const hubData = await getFanHubBySubdomain(subdomain);
                
                if (!hubData || !hubData.fanHubId) {
                    setIsAuthorized(false);
                    return;
                }

                setFanHubId(hubData.fanHubId);

                const memberData = await checkIsMember(hubData.fanHubId);

                if (memberData && memberData.isMember) {
                    // Only MODERATOR and VTUBER can access moderation
                    const allowedRoles = ["MODERATOR", "VTUBER"];
                    if (allowedRoles.includes(memberData.roleInHub)) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Authorization check failed:", error);
                setIsAuthorized(false);
            }
        };

        fetchHubAndCheckAuth();
    }, [subdomain]);

    // Show loading state while checking authorization
    if (isAuthorized === null) {
        return (
            <UserLayout>
                <div style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    minHeight: "400px",
                    fontSize: "18px",
                    color: "#666"
                }}>
                    Checking authorization...
                </div>
            </UserLayout>
        );
    }

    // Redirect or show access denied
    if (!isAuthorized) {
        return (
            <UserLayout>
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "center", 
                    alignItems: "center", 
                    minHeight: "400px",
                    gap: "16px"
                }}>
                    <h2 style={{ color: "#d32f2f", margin: 0 }}>Access Denied</h2>
                    <p style={{ color: "#666", margin: 0 }}>
                        You don't have permission to access this page. Only Moderators and VTubers can access moderation.
                    </p>
                    <button
                        onClick={() => router.push(`/hub/${subdomain}`)}
                        style={{
                            padding: "10px 24px",
                            background: "#000",
                            color: "#fff",
                            border: "none",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600
                        }}
                    >
                        Back to Hub
                    </button>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <HubModerationPage />
        </UserLayout>
    );
}

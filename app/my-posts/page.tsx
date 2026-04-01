'use client';


import MyPostsPage from "@/views/Users/MyPostsPage/MyPostsPage";

import UserLayout from "@/components/UserLayout/UserLayout";

export default function MyPosts() {
    return (
        <UserLayout>
            <MyPostsPage/>
        </UserLayout>
    );
}
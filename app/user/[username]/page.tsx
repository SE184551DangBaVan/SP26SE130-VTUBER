'use client'
import {useParams} from "next/navigation";
import ProfilePage from "@/views/Users/ProfilePage/ProfilePage";
import UserLayout from "@/components/UserLayout/UserLayout";

export default function UserProfile() {
  const { username } = useParams();


  return (
      <UserLayout>
          <ProfilePage username={username}/>
      </UserLayout>
  );
}

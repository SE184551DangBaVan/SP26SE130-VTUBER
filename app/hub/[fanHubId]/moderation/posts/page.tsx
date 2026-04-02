import UserLayout from "@/components/UserLayout/UserLayout";
import PostModerationPage from '@/views/Users/PostModerationPage/PostModerationPage';
export default function HubPostsModerationRoute(){
    return(
        <UserLayout>
            <PostModerationPage/>
        </UserLayout>
    );
}
import UserLayout from "@/components/UserLayout/UserLayout";
import HubModerationPage from '@/views/Users/PostModerationPage/HubModerationPage';
export default function HubPostsModerationRoute(){
    return(
        <UserLayout>
            <HubModerationPage/>
        </UserLayout>
    );
}

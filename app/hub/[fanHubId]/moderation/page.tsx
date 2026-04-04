import UserLayout from "@/components/UserLayout/UserLayout";
import HubModerationPage from '@/views/Users/HubModerationPage/HubModerationPage';
export default function HubPostsModerationRoute(){
    return(
        <UserLayout>
            <HubModerationPage/>
        </UserLayout>
    );
}

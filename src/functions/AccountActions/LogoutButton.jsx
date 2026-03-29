import { useAuth } from '../Auth/useAuth';
import './LogoutButton.css'

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className='logout__btn-container'>
      <button className='logout__btn' onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

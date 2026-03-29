import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { getUserById, registerVtuberApplication } from '@/services/UserController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './CreateHubPage.css';

export default function CreateHubPage() {
  const { userAuth } = useAuth();
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  
  // Application form state
  const [channelName, setChannelName] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = sessionStorage.getItem('userID') || localStorage.getItem('userID');
      
      if (!storedUserId) {
        console.error('No user ID found in storage');
        setLoading(false);
        setChecking(false);
        return;
      }

      setUserId(storedUserId);

      // Check user role
      const userData = await getUserById(storedUserId);
      
      if (userData) {
        setUserRole(userData.role);
        
        // If user is already a VTUBER, they can access the hub creation page
        if (userData.role === 'VTUBER') {
          setChecking(false);
        }
      }
      
      setLoading(false);
      setChecking(false);
    };

    fetchUserId();
  }, []);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!channelName.trim() || !channelLink.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Submitting application...');

    try {
      const result = await registerVtuberApplication(userId, channelName, channelLink);

      if (result?.success) {
        updateToast(toastId, 'success', 'Application submitted successfully!');
        
        // Re-check user role after submission
        setTimeout(async () => {
          const userData = await getUserById(userId);
          if (userData?.role === 'VTUBER') {
            setUserRole('VTUBER');
            setChecking(false);
          } else {
            showSuccess('Application submitted! Please wait for admin approval.');
          }
        }, 2000);
      } else {
        updateToast(toastId, 'error', result?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className='create-hub-page-container'>
        <div className='loading-state'>Loading...</div>
      </div>
    );
  }

  // If user is already a VTUBER, show the actual hub creation page
  if (userRole === 'VTUBER' && !checking) {
    return (
      <div className='create-hub-page-container'>
        <div className='create-hub-content'>
          <h1>Create Your FanHub</h1>
          <p>Welcome! You can now create your FanHub.</p>
          {/* TODO: Add hub creation form */}
        </div>
      </div>
    );
  }

  // Show VTuber application form
  return (
    <div className='create-hub-page-container'>
      <div className='vtuber-application-wrapper'>
        <div className='application-card'>
          <div className='application-header'>
            <h1>VTuber Application</h1>
            <p className='application-subtitle'>
              You need to be a verified VTuber first to create a FanHub
            </p>
          </div>

          <div className='application-info'>
            <div className='info-icon'>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <p>
              Submit your YouTube channel for verification. 
              Our admin team will review your application soon.
            </p>
          </div>

          <form onSubmit={handleApplicationSubmit} className='application-form'>
            <div className='form-group'>
              <label htmlFor='channelName'>Channel Name</label>
              <input
                id='channelName'
                type='text'
                className='form-input'
                placeholder='e.g., Vtuber Name Ch. hololive-EN'
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
            </div>

            <div className='form-group'>
              <label htmlFor='channelLink'>Channel Link</label>
              <input
                id='channelLink'
                type='url'
                className='form-input'
                placeholder='e.g., https://www.youtube.com/@VTuberChannel'
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                required
              />
            </div>

            <button 
              type='submit' 
              className='submit-btn'
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <div className='application-status'>
            <p className='status-text'>
              Current Status: <span className='status-badge pending'>PENDING</span>
            </p>
            <p className='status-note'>
              After approval, you'll be able to create your FanHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

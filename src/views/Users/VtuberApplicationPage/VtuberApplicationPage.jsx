import { useState, useEffect } from 'react';
import { getUserById, registerVtuberApplication } from '@/services/UserController';
import { getMyVtuberApplications } from '@/services/VtuberApplicationController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './VtuberApplicationPage.css';

export default function VtuberApplicationPage() {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' or 'history'

  // Application form state
  const [channelName, setChannelName] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [channelId, setChannelId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [applications, setApplications] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = sessionStorage.getItem('userID') || localStorage.getItem('userID');
      if (!storedUserId) {
        setLoading(false);
        return;
      }
      setUserId(storedUserId);

      try {
        const userData = await getUserById(storedUserId);
        if (userData) {
          setRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && userId) {
      fetchHistory();
    }
  }, [activeTab, userId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getMyVtuberApplications();
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching application history:', error);
      showError('Failed to load application history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      showError('Please log in before submitting an application');
      return;
    }

    if (!channelName.trim() || !channelLink.trim() || !channelId.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Submitting application...');

    try {
      const result = await registerVtuberApplication({
        userId,
        channelName,
        channelLink,
        channelId
      });

      if (result?.success) {
        updateToast(toastId, 'success', 'Application submitted successfully!');
        setChannelName('');
        setChannelLink('');
        setChannelId('');
        
        // Switch to history to see the new application
        setActiveTab('history');
        
        setTimeout(async () => {
          const userData = await getUserById(userId);
          if (userData?.role === 'VTUBER') {
            setRole('VTUBER');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className='vtuber-application-page-container'>
        <div className='loading-state'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='vtuber-application-page-container'>
      <div className='vtuber-application-wrapper'>
        {/* Tabs */}
        <div className='application-tabs'>
          <button 
            className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`}
            onClick={() => setActiveTab('apply')}
          >
            Send Application
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            My Applications
          </button>
        </div>

        <div className='application-card'>
          {activeTab === 'apply' ? (
            <>
              {role === 'VTUBER' ? (
                <div className='already-vtuber'>
                  <div className='application-header'>
                    <h1>Already a VTuber</h1>
                    <p className='application-subtitle'>
                      You have already been verified as a VTuber.
                    </p>
                  </div>
                  <div className='application-status'>
                    <p className='status-text'>
                      Current Status: <span className='status-badge approved' style={{backgroundColor: '#d4edda', color: '#155724'}}>APPROVED</span>
                    </p>
                    <p className='status-note'>
                      You can now go to the Create Hub page to set up your FanHub.
                    </p>
                  </div>
                </div>
              ) : (
                <>
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

                    <div className='form-group'>
                      <label htmlFor='channelId'>Channel ID</label>
                      <input
                        id='channelId'
                        type='password'
                        className='form-input'
                        placeholder='e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw'
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
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
                </>
              )}
            </>
          ) : (
            <div className='application-history'>
              <div className='application-header'>
                <h1>Application History</h1>
                <p className='application-subtitle'>
                  Track your VTuber verification status
                </p>
              </div>

              {historyLoading ? (
                <div className='history-loading'>Loading history...</div>
              ) : applications.length === 0 ? (
                <div className='empty-history'>You haven't submitted any applications yet.</div>
              ) : (
                <div className='history-list'>
                  {applications.map((app) => (
                    <div key={app.id} className='history-item'>
                      <div className='history-item-header'>
                        <span className='app-id'>ID: #{app.id}</span>
                        <span className={`status-badge ${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className='history-item-body'>
                        <div className='history-detail'>
                          <strong>Channel:</strong> {app.channelName}
                        </div>
                        <div className='history-detail'>
                          <strong>Link:</strong> <a href={app.channelLink} target='_blank' rel='noopener noreferrer'>{app.channelLink}</a>
                        </div>
                        <div className='history-detail'>
                          <strong>Sent At:</strong> {formatDate(app.createdAt)}
                        </div>
                        {app.reviewAt && (
                          <div className='history-detail'>
                            <strong>Reviewed At:</strong> {formatDate(app.reviewAt)}
                          </div>
                        )}
                        {app.reviewerUsername && (
                          <div className='history-detail'>
                            <strong>Reviewer:</strong> {app.reviewerUsername}
                          </div>
                        )}
                        {app.reason && (
                          <div className='history-detail reason-box'>
                            <strong>Reason:</strong> {app.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getVtuberApplications, reviewVtuberApplication } from '@/services/VtuberApplicationController';
import './VtuberApplicationContent.css';

export default function VtuberApplicationContent() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const data = await getVtuberApplications(0, 100, 'createdAt');
    setApplications(data);
    setLoading(false);
  };

  const handleEditClick = (app) => {
    setSelectedApp(app);
    setReviewStatus('');
    setReviewReason('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApp(null);
    setReviewStatus('');
    setReviewReason('');
  };

  const handleSubmitReview = async () => {
    if (!reviewStatus || !reviewReason.trim()) {
      alert('Please select a status and enter a reason');
      return;
    }

    setSubmitting(true);
    const result = await reviewVtuberApplication(
      selectedApp.id,
      reviewStatus,
      reviewReason.trim()
    );

    if (result?.success) {
      alert(`Application ${reviewStatus.toLowerCase()} successfully`);
      handleCloseModal();
      fetchApplications();
    } else {
      alert(result?.message || 'Failed to review application');
    }
    setSubmitting(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  };

  const paginatedApps = applications.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <>
      <div className='admin-page-header'>
        <h1>VTuber Application Management</h1>
        <button className='refresh-btn' onClick={fetchApplications}>
          ↻ Refresh
        </button>
      </div>

      <div className='applications-table-container'>
        {loading ? (
          <div className='loading-state'>Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className='empty-state'>No applications found</div>
        ) : (
          <>
            <table className='applications-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Channel Name</th>
                  <th>Channel Link</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.username}</td>
                    <td>{app.channelName}</td>
                    <td>
                      <a 
                        href={app.channelLink} 
                        target='_blank' 
                        rel='noopener noreferrer'
                        className='channel-link'
                      >
                        {app.channelLink}
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>{formatDate(app.createdAt)}</td>
                    <td>
                      <button 
                        className='edit-btn'
                        onClick={() => handleEditClick(app)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className='pagination'>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span>Page {currentPage + 1} of {Math.ceil(applications.length / itemsPerPage)}</span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                disabled={(currentPage + 1) * itemsPerPage >= applications.length}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {showModal && selectedApp && (
        <div className='modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Review Application</h2>
              <button className='modal-close' onClick={handleCloseModal}>×</button>
            </div>

            <div className='modal-body'>
              <div className='application-details'>
                <div className='detail-row'>
                  <span className='detail-label'>Username:</span>
                  <span className='detail-value'>{selectedApp.username}</span>
                </div>
                <div className='detail-row'>
                  <span className='detail-label'>Channel Name:</span>
                  <span className='detail-value'>{selectedApp.channelName}</span>
                </div>
                <div className='detail-row'>
                  <span className='detail-label'>Channel Link:</span>
                  <a 
                    href={selectedApp.channelLink} 
                    target='_blank' 
                    rel='noopener noreferrer'
                    className='channel-link'
                  >
                    {selectedApp.channelLink}
                  </a>
                </div>
                <div className='detail-row'>
                  <span className='detail-label'>Current Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
                {selectedApp.reason && (
                  <div className='detail-row'>
                    <span className='detail-label'>Previous Reason:</span>
                    <span className='detail-value'>{selectedApp.reason}</span>
                  </div>
                )}
                <div className='detail-row'>
                  <span className='detail-label'>Applied At:</span>
                  <span className='detail-value'>{formatDate(selectedApp.createdAt)}</span>
                </div>
              </div>

              <div className='review-form'>
                <div className='form-group'>
                  <label>Status *</label>
                  <div className='status-buttons'>
                    <button
                      type='button'
                      className={`status-option-btn ${reviewStatus === 'ACCEPTED' ? 'selected' : ''}`}
                      onClick={() => setReviewStatus('ACCEPTED')}
                    >
                      ✓ Approve
                    </button>
                    <button
                      type='button'
                      className={`status-option-btn reject ${reviewStatus === 'REJECTED' ? 'selected' : ''}`}
                      onClick={() => setReviewStatus('REJECTED')}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>

                <div className='form-group'>
                  <label>Reason *</label>
                  <textarea
                    className='reason-input'
                    placeholder='Enter reason for approval or rejection...'
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button className='cancel-btn' onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className='submit-btn' 
                onClick={handleSubmitReview}
                disabled={submitting || !reviewStatus || !reviewReason.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

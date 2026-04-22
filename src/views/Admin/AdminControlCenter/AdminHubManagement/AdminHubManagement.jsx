import { useState, useEffect } from 'react';
import { getFanHubs, strikeFanHub } from '@/services/FanHubController';
import './AdminHubManagement.css';

export default function AdminHubManagement() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [strikeReason, setStrikeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    const data = await getFanHubs(0, 100);
    setHubs(data);
    setLoading(false);
  };

  const handleStrikeClick = (hub) => {
    setSelectedHub(hub);
    setStrikeReason('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedHub(null);
    setStrikeReason('');
  };

  const handleConfirmStrike = async () => {
    if (!strikeReason.trim()) {
      alert('Please enter a reason');
      return;
    }

    setSubmitting(true);
    const result = await strikeFanHub(selectedHub.fanHubId, strikeReason.trim());

    if (result?.success) {
      alert('FanHub striked successfully');
      handleCloseModal();
      fetchHubs();
    } else {
      alert(result?.message || 'Failed to strike FanHub');
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

  const paginatedHubs = hubs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <>
      <div className='admin-page-header'>
        <h1>Fan Hub Management</h1>
        <button className='refresh-btn' onClick={fetchHubs}>
          ↻ Refresh
        </button>
      </div>

      <div className='applications-table-container'>
        {loading ? (
          <div className='loading-state'>Loading fan hubs...</div>
        ) : hubs.length === 0 ? (
          <div className='empty-state'>No fan hubs found</div>
        ) : (
          <>
            <table className='applications-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hub Name</th>
                  <th>Subdomain</th>
                  <th>Owner Username</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHubs.map((hub, i) => (
                  <tr key={hub.fanHubId}>
                    <td>{i+1}</td>
                    <td>{hub.hubName}</td>
                    <td>{hub.subdomain}</td>
                    <td>{hub.ownerUsername || 'N/A'}</td>
                    <td>{formatDate(hub.createdAt)}</td>
                    <td>
                      <button 
                        className='strike-btn'
                        onClick={() => handleStrikeClick(hub)}
                      >
                        Strike
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
              <span>Page {currentPage + 1} of {Math.ceil(hubs.length / itemsPerPage)}</span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                disabled={(currentPage + 1) * itemsPerPage >= hubs.length}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {showModal && selectedHub && (
        <div className='modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Strike FanHub</h2>
              <button className='modal-close' onClick={handleCloseModal}>×</button>
            </div>

            <div className='modal-body'>
              <div className='strike-confirmation'>
                <p>Strike this FanHub?</p>
                <div className='hub-details'>
                  <div className='detail-row'>
                    <span className='detail-label'>Hub Name:</span>
                    <span className='detail-value'>{selectedHub.hubName}</span>
                  </div>
                  <div className='detail-row'>
                    <span className='detail-label'>Subdomain:</span>
                    <span className='detail-value'>{selectedHub.subdomain}</span>
                  </div>
                  <div className='detail-row'>
                    <span className='detail-label'>Owner:</span>
                    <span className='detail-value'>{selectedHub.ownerUsername || 'N/A'}</span>
                  </div>
                </div>

                <div className='form-group'>
                  <label>Reason *</label>
                  <textarea
                    className='reason-input'
                    placeholder='Enter reason for striking...'
                    value={strikeReason}
                    onChange={(e) => setStrikeReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button className='cancel-btn' onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className='confirm-btn' 
                onClick={handleConfirmStrike}
                disabled={submitting || !strikeReason.trim()}
              >
                {submitting ? 'Striking...' : 'Confirm Strike'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
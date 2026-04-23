import { useState, useEffect } from 'react';
import { getFanHubs, strikeFanHub, deactivateFanHub } from '@/services/FanHubController';
import { getFanHubReportsWithReports } from '@/services/HubReportController';
import './AdminHubManagement.css';

export default function AdminHubManagement() {
  const [hubs, setHubs] = useState([]);
  const [hubReports, setHubReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedHubReports, setSelectedHubReports] = useState([]);
  const [strikeReason, setStrikeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    const [hubsData, reportsData] = await Promise.all([
      getFanHubs(0, 100),
      getFanHubReportsWithReports(0, 100, 'createdAt')
    ]);
    setHubs(hubsData);
    setHubReports(reportsData);
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

  const handleDeactivateClick = (hub) => {
    setSelectedHub(hub);
    setShowDeactivateModal(true);
  };

  const handleCloseDeactivateModal = () => {
    setShowDeactivateModal(false);
    setSelectedHub(null);
  };

  const handleConfirmDeactivate = async () => {
    setSubmitting(true);
    const result = await deactivateFanHub(selectedHub.fanHubId);

    if (result?.success) {
      alert('FanHub deactivated successfully');
      handleCloseDeactivateModal();
      fetchHubs();
    } else {
      alert(result?.message || 'Failed to deactivate FanHub');
    }
    setSubmitting(false);
  };

  const getReportCount = (fanHubId) => {
    const hubReport = hubReports.find(report => report.fanHubId === fanHubId);
    return hubReport ? hubReport.reports.length : 0;
  };

  const handleReportsClick = (hub) => {
    const hubReport = hubReports.find(report => report.fanHubId === hub.fanHubId);
    setSelectedHub(hub);
    setSelectedHubReports(hubReport ? hubReport.reports : []);
    setShowReportsModal(true);
  };

  const handleCloseReportsModal = () => {
    setShowReportsModal(false);
    setSelectedHub(null);
    setSelectedHubReports([]);
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
                  <th>Reports</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHubs.map((hub, i) => {
                  const reportCount = getReportCount(hub.fanHubId);
                  return (
                    <tr key={hub.fanHubId}>
                      <td>{i+1}</td>
                      <td>{hub.hubName}</td>
                      <td>{hub.subdomain}</td>
                      <td>{hub.ownerUsername}</td>
                      <td>{formatDate(hub.createdAt)}</td>
                      <td>
                        <button
                          className={`reports-count ${reportCount === 1 ? 'first-reports' : ''} ${reportCount === 2 ? 'mild-reports' : ''} ${reportCount > 3 ? 'high-reports' : ''}`}
                          onClick={() => handleReportsClick(hub)}
                        >
                          {reportCount}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className='strike-btn'
                            onClick={() => handleStrikeClick(hub)}
                          >
                            Strike
                          </button>
                          <button
                            className='deactivate-btn'
                            onClick={() => handleDeactivateClick(hub)}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {showDeactivateModal && selectedHub && (
        <div className='modal-overlay' onClick={handleCloseDeactivateModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Deactivate this FanHub?</h2>
              <button className='modal-close' onClick={handleCloseDeactivateModal}>×</button>
            </div>

            <div className='modal-body'>
              <div className='deactivate-confirmation'>
                <p>By confirming you will remove all access to <strong>{selectedHub.hubName}</strong> from every user, including the owner: <strong>{selectedHub.ownerUsername || 'N/A'}</strong></p>
              </div>
            </div>

            <div className='modal-footer'>
              <button className='cancel-btn' onClick={handleCloseDeactivateModal}>
                Cancel
              </button>
              <button
                className='confirm-btn'
                onClick={handleConfirmDeactivate}
                disabled={submitting}
              >
                {submitting ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportsModal && selectedHub && (
        <div className='modal-overlay' onClick={handleCloseReportsModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Reports for {selectedHub.hubName}</h2>
              <button className='modal-close' onClick={handleCloseReportsModal}>×</button>
            </div>

            <div className='modal-body'>
              <div className='reports-list'>
                {selectedHubReports.length === 0 ? (
                  <p>No reports found for this hub.</p>
                ) : (
                  <div className='reports-container'>
                    {selectedHubReports.map((report) => (
                      <div key={report.reportId} className='report-item'>
                        <div className='report-header'>
                          <div className='report-meta'>
                            <span className='reporter-name'>
                              Reported by: {report.reportedByDisplayName || report.reportedByUsername}
                            </span>
                            <span className='report-date'>
                              {formatDate(report.reportCreatedAt)}
                            </span>
                          </div>
                          <div className={`report-status ${report.reportStatus.toLowerCase()}`}>
                            {report.reportStatus}
                          </div>
                        </div>
                        <div className='report-reason'>
                          <strong>Reason:</strong> {report.reason}
                        </div>
                        {report.resolveMessage && (
                          <div className='report-resolution'>
                            <strong>Resolution:</strong> {report.resolveMessage}
                          </div>
                        )}
                        {report.resolvedByDisplayName && (
                          <div className='report-resolved-by'>
                            <strong>Resolved by:</strong> {report.resolvedByDisplayName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='modal-footer'>
              <button className='cancel-btn' onClick={handleCloseReportsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





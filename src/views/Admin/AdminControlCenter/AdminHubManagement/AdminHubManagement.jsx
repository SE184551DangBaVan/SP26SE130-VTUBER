import { useState, useEffect } from 'react';
import { getFanHubs, strikeFanHub, deactivateFanHub } from '@/services/FanHubController';
import { getFanHubReportsWithReports, bulkResolveFanHubReports } from '@/services/HubReportController';
import { useRouter } from 'next/navigation';
import './AdminHubManagement.css';

export default function AdminHubManagement() {
  const [hubs, setHubs] = useState([]);
  const [hubReports, setHubReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedHubReports, setSelectedHubReports] = useState([]);
  const [strikeReason, setStrikeReason] = useState('');
  const [resolveMessage, setResolveMessage] = useState('');
  const [resolveTargetReportIds, setResolveTargetReportIds] = useState([]);
  const [resolveTargetLabel, setResolveTargetLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState('manage');
  const router = useRouter();
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

  const handleVisitHub = (subdomain) => {
    if (!subdomain) return;
    router.push(`/hub/${subdomain}`);
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
    const strikeCount = getStrikeCount(hub.fanHubId) ?? hub.strikeCount ?? 0;
    setSelectedHub({ ...hub, strikeCount });
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

  const getHubReportData = (fanHubId) => hubReports.find(report => report.fanHubId === fanHubId);

  const getReportCount = (fanHubId) => {
    const hubReport = getHubReportData(fanHubId);
    return hubReport ? hubReport.reports.length : 0;
  };

  const getStrikeCount = (fanHubId) => {
    const hubReport = getHubReportData(fanHubId);
    return hubReport?.strikeCount ?? 0;
  };

  const handleOpenResolveModal = (reportIds, label) => {
    setResolveTargetReportIds(reportIds);
    setResolveTargetLabel(label);
    setResolveMessage('');
    setShowResolveModal(true);
  };

  const handleCloseResolveModal = () => {
    setShowResolveModal(false);
    setResolveTargetReportIds([]);
    setResolveTargetLabel('');
    setResolveMessage('');
  };

  const handleSubmitResolve = async () => {
    if (resolveTargetReportIds.length === 0) return;

    setSubmittingResolve(true);
    const result = await bulkResolveFanHubReports(resolveTargetReportIds, resolveMessage.trim());

    if (result?.success) {
      alert(resolveTargetReportIds.length === 1 ?
        `Report resolved successfully` :
        'Reports resolved successfully');
      await fetchHubs();
      const hubReport = getHubReportData(selectedHub.fanHubId);
      setSelectedHubReports(hubReport ? hubReport.reports : []);
      handleCloseResolveModal();
    } else {
      alert(result?.message || 'Failed to resolve reports');
    }
    setSubmittingResolve(false);
  };

  const handleResolveReport = (report) => {
    if (!report?.reportId) return;
    handleOpenResolveModal([report.reportId], `Resolve Report #${report.reportId}`);
  };

  const handleResolveAllReports = () => {
    const reportIds = selectedHubReports.map(report => report.reportId);
    if (reportIds.length === 0) return;
    handleOpenResolveModal(reportIds, 'Resolve all reports');
  };

  const handleReportsClick = (hub) => {
    const hubReport = getHubReportData(hub.fanHubId);
    const strikeCount = hubReport?.strikeCount ?? hub.strikeCount ?? 0;
    setSelectedHub({ ...hub, strikeCount });
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

  const reportedHubs = hubs.filter(hub => getReportCount(hub.fanHubId) > 0);
  const managedHubs = hubs;
  
  const getTabHubs = () => activeTab === 'reported' ? reportedHubs : managedHubs;
  const tabHubs = getTabHubs();
  const paginatedHubs = tabHubs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

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
            <div className='hub-management-tabs'>
              <button 
                className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('manage');
                  setCurrentPage(0);
                }}
              >
                Manage Fan Hubs
              </button>
              <button 
                className={`tab-button ${activeTab === 'reported' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('reported');
                  setCurrentPage(0);
                }}
              >
                Reported Fan Hubs ({reportedHubs.length})
              </button>
            </div>
            {paginatedHubs.length === 0 ? (
              <div className='empty-state'>No fan hubs found in this tab</div>
            ) : (
              <table className='applications-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hub Name</th>
                  <th>Subdomain</th>
                  <th>Owner Username</th>
                  <th>Created At</th>
                  {activeTab === 'manage' && <th>Strikes</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHubs.map((hub, i) => {
                  const reportCount = getReportCount(hub.fanHubId);
                  const strikeCount = getStrikeCount(hub.fanHubId);
                  return (
                    <tr key={hub.fanHubId}>
                      <td>{i + 1}</td>
                      <td>{hub.hubName}</td>
                      <td>{hub.subdomain}</td>
                      <td>{hub.ownerUsername}</td>
                      <td>{formatDate(hub.createdAt)}</td>
                      {activeTab === 'manage' ? (
                        <>
                          <td>
                            <span className='strike-count-display'>{strikeCount} Strikes</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className='deactivate-btn'
                                onClick={() => handleDeactivateClick(hub)}
                              >
                                Deactivate
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td>
                          <div className="action-buttons">
                            <button
                              className={`reports-count ${reportCount === 1 ? 'first-reports' : ''} ${reportCount === 2 ? 'mild-reports' : ''} ${reportCount > 3 ? 'high-reports' : ''}`}
                              onClick={() => handleReportsClick(hub)}
                            >
                              {reportCount} Reports
                            </button>
                            <button
                              className='strike-btn'
                              onClick={() => handleStrikeClick(hub)}
                            >
                              Strike
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
            
            <div className='pagination'>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span>Page {currentPage + 1} of {Math.ceil(tabHubs.length / itemsPerPage)}</span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                disabled={(currentPage + 1) * itemsPerPage >= tabHubs.length}
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
                {selectedHub.strikeCount < 3 ? (
                  <p>This Hub hasn’t accumulated enough strikes to be Deactivated, are you sure?</p>
                ) : (
                  <p>By confirming you will remove all access to <strong>{selectedHub.hubName}</strong> from every user, including the owner: <strong>{selectedHub.ownerUsername || 'N/A'}</strong></p>
                )}
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
              <div className='modal-header-left'>
                <h2>Reports for {selectedHub.hubName}</h2>
                <button
                  className='visit-hub-btn resolve-all-btn'
                  onClick={() => handleVisitHub(selectedHub.subdomain)}
                >
                  Visit
                </button>
              </div>

              <div className='modal-header-right'>
                <button
                  className='modal-close'
                  onClick={handleCloseReportsModal}
                >
                  ×
                </button>
              </div>
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
                          <strong>Reason:</strong> <span>{report.reason}</span>
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
                        <div className='report-actions'>
                          <button
                            className='resolve-single-btn'
                            onClick={() => handleResolveReport(report)}
                            disabled={submittingResolve}
                          >
                            Resolve
                          </button>
                        </div>
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
              <button
                className='resolve-all-btn'
                onClick={handleResolveAllReports}
                disabled={submittingResolve || selectedHubReports.length === 0}
              >
                {submittingResolve ? 'Resolving...' : 'Resolve all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && selectedHub && (
        <div className='modal-overlay' onClick={handleCloseResolveModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>{resolveTargetLabel || 'Resolve reports'}</h2>
              <button className='modal-close' onClick={handleCloseResolveModal}>×</button>
            </div>

            <div className='modal-body'>
              <div className='form-group'>
                <label>Resolve Message (optional)</label>
                <textarea
                  className='reason-input'
                  placeholder='Enter resolve message...'
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  rows={5}
                />
              </div>
            </div>

            <div className='modal-footer'>
              <button className='cancel-btn' onClick={handleCloseResolveModal}>
                Close
              </button>
              <button
                className='confirm-btn'
                onClick={handleSubmitResolve}
                disabled={submittingResolve}
              >
                {submittingResolve ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





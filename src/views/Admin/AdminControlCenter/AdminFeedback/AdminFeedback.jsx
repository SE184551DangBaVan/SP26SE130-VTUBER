import { useState, useEffect } from 'react';
import { getAllFeedback } from '@/services/FeedbackController';
import './AdminFeedback.css';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const data = await getAllFeedback(0, 100, 'createdAt');
    setFeedbacks(data);
    setLoading(false);
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

  const truncateContent = (content, length = 50) => {
    if (!content) return '';
    return content.length > length ? `${content.slice(0, length)}...` : content;
  };

  const getReadStatusBadgeClass = (isRead) => {
    return isRead ? 'status-read' : 'status-unread';
  };

  const paginatedFeedbacks = feedbacks.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <>
      <div className='admin-page-header'>
        <h1>Feedback Management</h1>
        <button className='refresh-btn' onClick={fetchFeedbacks}>
          ↻ Refresh
        </button>
      </div>

      <div className='feedbacks-table-container'>
        {loading ? (
          <div className='loading-state'>Loading feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className='empty-state'>No feedbacks found</div>
        ) : (
          <>
            <table className='feedbacks-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Content</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.map((feedback) => (
                  <tr key={feedback.feedbackId}>
                    <td>{feedback.feedbackId}</td>
                    <td>
                      <div className='user-info'>
                        <div className='username'>{feedback.username}</div>
                        {feedback.displayName && feedback.displayName !== feedback.username && (
                          <div className='display-name'>{feedback.displayName}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className='category-badge'>{feedback.categoryName}</span>
                    </td>
                    <td className='content-cell'>
                      <span title={feedback.content}>{truncateContent(feedback.content)}</span>
                    </td>
                    <td>{formatDate(feedback.createdAt)}</td>
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
              <span>Page {currentPage + 1} of {Math.ceil(feedbacks.length / itemsPerPage)}</span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)} 
                disabled={(currentPage + 1) * itemsPerPage >= feedbacks.length}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

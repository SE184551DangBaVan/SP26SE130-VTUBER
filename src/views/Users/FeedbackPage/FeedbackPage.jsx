import { useState, useEffect } from 'react';
import { getFeedbackCategories, submitFeedback, getMyFeedback } from '@/services/FeedbackController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './FeedbackPage.css';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'history'

  // Form state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getFeedbackCategories();
        if (data && data.length > 0) {
          setCategories(data);
          setSelectedCategory(data[0].id); // Default to first category
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        showError('Failed to load feedback categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getMyFeedback();
      setFeedbackHistory(data || []);
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      showError('Failed to load feedback history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      showError('Please select a feedback category');
      return;
    }

    if (!feedbackContent.trim()) {
      showError('Please enter your feedback');
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Submitting feedback...');

    try {
      const result = await submitFeedback(selectedCategory, feedbackContent);

      if (result?.success) {
        updateToast(toastId, 'success', 'Feedback submitted successfully!');
        setFeedbackContent('');
        
        // Switch to history to see the new feedback
        setActiveTab('history');
      } else {
        updateToast(toastId, 'error', result?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.categoryName : 'Unknown';
  };

  if (loading) {
    return (
      <div className='feedback-page-container'>
        <div className='loading-state'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='feedback-page-container'>
      <div className='feedback-wrapper'>
        {/* Tabs */}
        <div className='feedback-tabs'>
          <button 
            className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            Send Feedback
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            My Feedback
          </button>
        </div>

        <div className='feedback-card'>
          {activeTab === 'submit' ? (
            <>
              <div className='feedback-header'>
                <h1>Send Us Your Feedback</h1>
                <p className='feedback-subtitle'>
                  Help us improve your experience by sharing your thoughts and suggestions
                </p>
              </div>

              <div className='feedback-info'>
                <div className='info-icon'>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p>
                  Your feedback helps us understand what's working well and where we can improve.
                  Thank you for taking the time to share your thoughts!
                </p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className='feedback-form'>
                <div className='form-group'>
                  <label htmlFor='category'>Feedback Category <span className='required'>*</span></label>
                  <select
                    id='category'
                    className='form-input form-select'
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(Number(e.target.value))}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label htmlFor='feedbackContent'>Your Feedback <span className='required'>*</span></label>
                  <textarea
                    id='feedbackContent'
                    className='form-input form-textarea'
                    placeholder='You must state your reasons for this Feedback...'
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type='submit' 
                  className='submit-btn'
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </>
          ) : (
            <div className='feedback-history'>
              <div className='feedback-header'>
                <h1>My Feedback</h1>
                <p className='feedback-subtitle'>
                  View your submitted feedback and their status
                </p>
              </div>

              {historyLoading ? (
                <div className='history-loading'>Loading feedback history...</div>
              ) : feedbackHistory.length === 0 ? (
                <div className='empty-history'>You haven't submitted any feedback yet.</div>
              ) : (
                <div className='history-list'>
                  {feedbackHistory.map((feedback) => (
                    <div key={feedback.feedbackId} className='history-item'>
                      <div className='history-item-header'>
                        <span className='feedback-id'>ID: #{feedback.id}</span>
                        <span className='feedback-category-badge'>
                          {getCategoryName(feedback.categoryId)}
                        </span>
                      </div>
                      <div className='history-item-body'>
                        <div className='history-detail'>
                          <strong>Content:</strong>
                          <p className='feedback-content'>{feedback.content}</p>
                        </div>
                        <div className='history-detail'>
                          <strong>Submitted At:</strong> {formatDate(feedback.createdAt)}
                        </div>
                        {feedback.responseAt && (
                          <div className='history-detail'>
                            <strong>Response At:</strong> {formatDate(feedback.responseAt)}
                          </div>
                        )}
                        {feedback.response && (
                          <div className='history-detail response-box'>
                            <strong>Admin Response:</strong>
                            <p>{feedback.response}</p>
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

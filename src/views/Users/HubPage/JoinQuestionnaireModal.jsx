'use client';

import { useState } from 'react';
import { GroupRounded } from '@mui/icons-material';
import './JoinQuestionnaireModal.css';

export default function JoinQuestionnaireModal({ questions, initialAnswers = [], onSubmit, onCancel, submitting }) {
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    if (initialAnswers.length > 0) {
      initialAnswers.forEach(ans => {
        initial[ans.questionId] = ans.content;
      });
    }
    return initial;
  });

  const isEditing = initialAnswers.length > 0;

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isAllAnswered = questions.every(q => answers[q.id]?.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllAnswered || submitting) return;

    let formattedAnswers;
    if (isEditing) {
      // For editing: { answerId, content }
      formattedAnswers = questions.map(q => {
        const existingAns = initialAnswers.find(ans => ans.questionId === q.id);
        return {
          answerId: existingAns?.id,
          content: answers[q.id].trim()
        };
      }).filter(ans => ans.answerId); // Ensure we have answerId
    } else {
      // For new join: { questionId, content }
      formattedAnswers = questions.map(q => ({
        questionId: q.id,
        content: answers[q.id].trim()
      }));
    }

    onSubmit(formattedAnswers);
  };

  return (
    <div className="join-modal-overlay" onClick={onCancel}>
      <div className="join-modal-content" onClick={e => e.stopPropagation()}>
        <div className="join-modal-header">
          <div className="header-title">
            <GroupRounded className="header-icon" />
            <h2>{isEditing ? 'Edit Join Request' : 'Join Community'}</h2>
          </div>
          <button className="join-modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="join-modal-body">
            <p className="join-modal-intro">
              {isEditing 
                ? 'Update your answers to the community questions below.' 
                : 'This FanHub requires approval. Please answer the following questions to submit your join request.'}
            </p>

            <div className="questions-form-list">
              {questions.map((q, index) => (
                <div key={q.id} className="question-entry">
                  <label className="question-label">
                    <span className="question-num">Q{index + 1}:</span> {q.content}
                  </label>
                  <textarea
                    className="answer-textarea"
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ''}
                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                    required
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="join-modal-footer">
            <button 
              type="button" 
              className="join-cancel-btn" 
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="join-submit-btn" 
              disabled={!isAllAnswered || submitting}
            >
              {submitting ? (
                <>
                  <span className="join-spinner" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

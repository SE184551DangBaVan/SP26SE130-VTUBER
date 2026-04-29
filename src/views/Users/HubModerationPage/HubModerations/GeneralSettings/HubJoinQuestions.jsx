"use client";

import { useState } from "react";
import { EditRounded, DragIndicatorRounded } from "@mui/icons-material";
import "./HubJoinQuestions.css";

export default function HubJoinQuestions({ 
  questions, 
  setQuestions, 
  deletedQuestionIds, 
  setDeletedQuestionIds,
  loading 
}) {
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionContent.trim()) return;

    const newQuestion = {
      id: `temp-${Date.now()}`, // Temporary ID for local tracking
      content: newQuestionContent.trim(),
      orderNumber: questions.length,
      isNew: true
    };

    setQuestions([...questions, newQuestion]);
    setNewQuestionContent("");
  };

  const handleDelete = (question) => {
    // If it's an existing question, mark it for backend deletion
    if (question.id && typeof question.id === 'number') {
      setDeletedQuestionIds([...deletedQuestionIds, question.id]);
    }
    
    // Remove from local list
    setQuestions(questions.filter(q => q.id !== question.id));
  };

  const startEditing = (question) => {
    setEditingId(question.id);
    setEditContent(question.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleUpdateLocal = (id) => {
    if (!editContent.trim()) return;

    setQuestions(questions.map(q => 
      q.id === id ? { ...q, content: editContent.trim() } : q
    ));
    setEditingId(null);
    setEditContent("");
  };

  // Drag and drop handlers (Local only)
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      e.target.classList.add("dragging");
    }, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newList = [...questions];
    const draggedItem = newList[draggedItemIndex];
    newList.splice(draggedItemIndex, 1);
    newList.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setQuestions(newList);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
    setDraggedItemIndex(null);
    // Note: We don't save to API here anymore. 
    // The final order will be sent when the parent's "Save Changes" is clicked.
  };

  if (loading) {
    return <div className="questions-loading">Loading questions...</div>;
  }

  return (
    <div className="hub-join-questions">
      <div className="settings-card">
        <h2>Approval Questions</h2>
        <p className="settings-help-text">
          These questions will be presented to users when they request to join your hub.
        </p>

        <form className="add-question-form" onSubmit={handleAddQuestion}>
          <input 
            type="text" 
            value={newQuestionContent} 
            onChange={(e) => setNewQuestionContent(e.target.value)}
            placeholder="Type a new question here..."
          />
          <button type="submit" className="add-btn" disabled={!newQuestionContent.trim()}>
            Add Question
          </button>
        </form>

        <div className="questions-list">
          {questions.length === 0 ? (
            <div className="no-questions">No questions added yet.</div>
          ) : (
            questions.map((q, index) => (
              <div 
                key={q.id} 
                className={`question-item ${q.isNew ? 'is-unsaved' : ''}`}
                draggable={editingId !== q.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="drag-handle">
                  <DragIndicatorRounded fontSize="small" />
                </div>
                <div className="question-number">Q{index + 1}</div>
                <div className="question-main">
                  {editingId === q.id ? (
                    <div className="edit-mode">
                      <input 
                        type="text" 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="confirm-edit-btn" onClick={() => handleUpdateLocal(q.id)}>✓</button>
                        <button className="cancel-edit-btn" onClick={cancelEditing}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <div className="question-content">{q.content}</div>
                      <div className="question-actions">
                        <button className="icon-btn edit-icon-btn" onClick={() => startEditing(q)} title="Edit">
                          <EditRounded fontSize="small" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {!editingId && (
                  <button className="top-right-delete" onClick={() => handleDelete(q)} title="Delete">
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

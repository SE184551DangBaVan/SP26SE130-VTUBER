import './AdminFeedback.css';

export default function AdminFeedback() {
  return (
    <div className='admin-page-header'>
      <h1>Feedbacks</h1>
      <button className='refresh-btn' onClick={() => window.location.reload()}>
        ↻ Refresh
      </button>
    </div>
  );
}

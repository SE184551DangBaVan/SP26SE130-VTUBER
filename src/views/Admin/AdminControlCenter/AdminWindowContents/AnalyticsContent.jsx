export default function AnalyticsContent() {
  return (
    <div className='admin-page-header'>
      <h1>Analytics Dashboard</h1>
      <button className='refresh-btn' onClick={() => window.location.reload()}>
        ↻ Refresh
      </button>
    </div>
  );
}

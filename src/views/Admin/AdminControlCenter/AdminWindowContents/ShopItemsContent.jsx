export default function ShopItemsContent() {
  return (
    <div className='admin-page-header'>
      <h1>Shop Items Management</h1>
      <button className='refresh-btn' onClick={() => window.location.reload()}>
        ↻ Refresh
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import './AnalyticsContent.css';

import VtuberIco from '../../../../assets/UI-Elements/vtuber-virtual-youtuber.svg';
import UserIco from '../../../../assets/UI-Elements/users.svg';
import FanHubIco from '../../../../assets/UI-Elements/fanhub.svg';
import { getAdminAnalytics } from '@/services/AnalyticsController';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const normalizeSubdomain = (subdomain) => {
  if (!subdomain) return '';
  return subdomain.startsWith('@') ? subdomain : `@${subdomain}`;
};

export default function AnalyticsContent() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fanhubs');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const response = await getAdminAnalytics();
      if (response.success) {
        setAnalytics(response.data || null);
        setError(null);
      } else {
        setAnalytics(null);
        setError(response.message || 'Failed to fetch analytics');
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const activeList = useMemo(() => {
    if (!analytics) return [];
    return activeTab === 'fanhubs'
      ? analytics.top5FanHubs || []
      : analytics.topVtubersByOshi || [];
  }, [analytics, activeTab]);

  useEffect(() => {
    if (activeList.length > 0) {
      const defaultId = activeTab === 'fanhubs'
        ? activeList[0].fanHubId
        : activeList[0].userId;
      setSelectedId(defaultId);
    } else {
      setSelectedId(null);
    }
  }, [activeList, activeTab]);

  const selectedItem = useMemo(() => {
    if (!activeList.length) return null;
    return activeList.find((item) => {
      return activeTab === 'fanhubs'
        ? item.fanHubId === selectedId
        : item.userId === selectedId;
    }) || activeList[0];
  }, [activeList, activeTab, selectedId]);

  const roleCounts = analytics?.userCountByRole || {};
  const hashtags = analytics?.trendingHashtags || [];

  const selectedAvatar = selectedItem?.avatarUrl || selectedItem?.bannerUrl || FanHubIco.src;
  const selectedTitle = selectedItem
    ? activeTab === 'fanhubs'
      ? selectedItem.hubName
      : selectedItem.username
    : 'No selection';
  const selectedSubtitle = selectedItem
    ? activeTab === 'fanhubs'
      ? normalizeSubdomain(selectedItem.subdomain)
      : selectedItem.email
    : '';
  const selectedDescription = selectedItem
    ? activeTab === 'fanhubs'
      ? selectedItem.description
      : selectedItem.bio
    : '';

  return (
    <div className='analytics-content'>
      <div className='analytics-header'>
        <div>
          <h1>Analytics Dashboard</h1>
          <p className='analytics-subtitle'>System metrics, top fanhubs and trending creators.</p>
        </div>
        <button className='refresh-btn' onClick={() => window.location.reload()}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className='analytics-status'>Loading analytics...</div>
      ) : error ? (
        <div className='analytics-status analytics-error'>{error}</div>
      ) : (
        <div className='analytics-grid'>
          <div className='analytics-left-pane'>
            <div className='analytics-stats-grid'>
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role} className='analytics-stat-card'>
                  <div className='analytics-stat-icon'>
                    <img
                      src={role === 'USER' ? UserIco.src : VtuberIco.src}
                      alt={role}
                    />
                  </div>
                  <div className='analytics-stat-content'>
                    <div className='analytics-stat-label'>{role}</div>
                    <div className='analytics-stat-value'>{count}</div>
                  </div>
                </div>
              ))}
            </div>

              <div className='analytics-tabs'>
                <button
                  className={activeTab === 'fanhubs' ? 'analytics-tab active' : 'analytics-tab'}
                  onClick={() => setActiveTab('fanhubs')}
                >
                  Top FanHubs
                </button>
                <button
                  className={activeTab === 'vtubers' ? 'analytics-tab active' : 'analytics-tab'}
                  onClick={() => setActiveTab('vtubers')}
                >
                  Top VTubers
                </button>
              </div>

            <div className='analytics-left-scroll'>
              <div className='analytics-summary-block'>
                {activeTab === 'fanhubs' && (
                  <div className='analytics-summary-row'>
                    <div className='analytics-summary-item'>
                      <span>Total Fanhub:</span>
                      <strong>{analytics.totalFanHub ?? 0}</strong>
                    </div>
                    <div className='analytics-summary-item analytics-summary-hashtags'>
                      <span>Trending Hashtags:</span>
                      <div className='analytics-hashtags'>
                        {hashtags.map((tag) => (
                          <span key={tag} className='analytics-tag'>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vtubers' && (
                  <div className='analytics-summary-row'>
                    <div className='analytics-summary-item analytics-summary-hashtags'>
                      <span>Trending Hashtags:</span>
                      <div className='analytics-hashtags'>
                        {hashtags.map((tag) => (
                          <span key={tag} className='analytics-tag'>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='analytics-list-container'>
                <div className='analytics-list-title'>
                  {activeTab === 'fanhubs' ? 'Top 5 Fanhubs' : 'Top 5 VTubers by Oshi'}
                </div>
                <div className='analytics-list'>
                  {activeList.map((item, index) => {
                    const isTop = index === 0;
                    const itemId = activeTab === 'fanhubs' ? item.fanHubId : item.userId;
                    const labelMain = activeTab === 'fanhubs' ? item.hubName : item.username;
                    const labelSub = activeTab === 'fanhubs'
                      ? normalizeSubdomain(item.subdomain)
                      : item.email;
                    const tags = activeTab === 'fanhubs'
                      ? item.categories || []
                      : [item.role || 'VTUBER'];

                    return (
                      <button
                        key={itemId}
                        type='button'
                        className={`analytics-list-item ${selectedId === itemId ? 'active' : ''}`}
                        onClick={() => setSelectedId(itemId)}
                      >
                        <div className='analytics-list-item-left'>
                          <div className='analytics-list-item-title'>
                            {labelMain}
                            {isTop && <span className='analytics-list-item-badge'>Top</span>}
                          </div>
                          <div className='analytics-list-item-sub'>{labelSub}</div>
                          <div className='analytics-list-item-tags'>
                            {tags.slice(0, 4).map((tag) => (
                              <span key={tag} className='analytics-tag'>#{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className='analytics-list-item-right'>
                          <span>{activeTab === 'fanhubs' ? item.memberCount : item.points}</span>
                          <img
                            src={item.avatarUrl || FanHubIco.src}
                            alt={labelMain}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className='analytics-right-pane'>
            <div className='analytics-detail-card'>
              <div className='analytics-detail-card-inner'>
                <div className='analytics-detail-card-top'>
                  <div className='analytics-detail-meta'>
                    <h2>{selectedTitle}</h2>
                    <p className='analytics-detail-subtitle'>{selectedSubtitle}</p>
                  </div>
                  <div className='analytics-detail-call'>
                    <div className='analytics-detail-avatar'>
                      <img
                        src={selectedAvatar || FanHubIco.src}
                        alt={selectedTitle}
                      />
                    </div>
                    <p className='analytics-detail-description'>
                      {selectedDescription || 'No description available for this selection.'}
                    </p>
                  </div>
                </div>

                <div className='analytics-detail-overview'>
                  <div className='analytics-detail-section'>
                    <div className='analytics-detail-section-title'>Summary</div>
                    {activeTab === 'fanhubs' ? (
                      <>
                        <div className='analytics-detail-row'>
                          <span>Owner</span>
                          <strong>{selectedItem?.ownerDisplayName || selectedItem?.ownerUsername || 'N/A'}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>Members</span>
                          <strong>{selectedItem?.memberCount ?? 0}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>Created</span>
                          <strong>{formatDate(selectedItem?.createdAt)}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>Privacy</span>
                          <strong>{selectedItem?.isPrivate ? 'Private' : 'Public'}</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='analytics-detail-row'>
                          <span>Points</span>
                          <strong>{selectedItem?.points ?? 0}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>Paid Points</span>
                          <strong>{selectedItem?.paidPoints ?? 0}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>Badges</span>
                          <strong>{selectedItem?.totalBadges ?? 0}</strong>
                        </div>
                        <div className='analytics-detail-row'>
                          <span>FanHubs</span>
                          <strong>{selectedItem?.totalFanHubs ?? 0}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className='analytics-detail-section'>
                    <div className='analytics-detail-section-title'>Tags</div>
                    <div className='analytics-hashtags analytics-hashtags-wrap'>
                      {(activeTab === 'fanhubs' ? selectedItem?.categories || [] : [selectedItem?.role || 'VTUBER']).map((tag) => (
                        <span key={tag} className='analytics-tag'>{`#${tag}`}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {activeTab === 'fanhubs' && (
                  <div className='analytics-detail-gallery'>
                    <div className='analytics-banner-preview'>
                      <img src={selectedItem?.bannerUrl || selectedItem?.avatarUrl || FanHubIco.src} alt='Banner' />
                    </div>
                    <div className='analytics-highlight-grid'>
                      {(selectedItem?.highlightImgUrls || []).map((src, idx) => (
                        <img key={`${src}-${idx}`} src={src} alt={`Highlight ${idx + 1}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

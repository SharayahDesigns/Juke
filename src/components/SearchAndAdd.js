import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, push } from 'firebase/database';

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;


const SearchAndAdd = ({ roomCode, userId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

   const getChannelImage = async (channelId) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`
      );
      const data = await res.json();
      return data?.items?.[0]?.snippet?.thumbnails?.default?.url || '';
    } catch {
      return '';
    }
  };

  const getVideoStats = async (videoId) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${API_KEY}`
      );
      const data = await res.json();
      const item = data?.items?.[0];
      return {
        views: item?.statistics?.viewCount || '0',
        publishedAt: item?.snippet?.publishedAt || '',
      };
    } catch {
      return { views: '0', publishedAt: '' };
    }
  };

  const formatViews = (num) => {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(num);
  };

  const formatDate = (dateStr) => {
    const publishedDate = new Date(dateStr);
    const diff = Date.now() - publishedDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const intervals = [
      { label: 'year', secs: 31536000 },
      { label: 'month', secs: 2592000 },
      { label: 'week', secs: 604800 },
      { label: 'day', secs: 86400 },
      { label: 'hour', secs: 3600 },
      { label: 'minute', secs: 60 },
      { label: 'second', secs: 1 },
    ];
    for (let i of intervals) {
      const val = Math.floor(seconds / i.secs);
      if (val >= 1) return `${val} ${i.label}${val > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
          query
        )}&key=${API_KEY}`
      );
      const data = await res.json();

      const enriched = await Promise.all(
        (data.items || []).map(async (video) => {
          const channelImage = await getChannelImage(video.snippet.channelId);
          const stats = await getVideoStats(video.id.videoId);
          return {
            ...video,
            channelImage,
            views: stats.views,
            publishedAt: stats.publishedAt,
          };
        })
      );

      setResults(enriched);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const addToQueue = async (video) => {
    console.log("video snippet", video.snippet)
    const videoData = {
      videoId: video.id.videoId,
      title: video.snippet.title,
      submittedBy: userId,
      timestamp: Date.now(),
    };
    await push(ref(db, `rooms/${roomCode}/queue`), videoData);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Search and Add Songs</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube..."
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#cc0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((video) => (
          <li
          className='youtube-card'
            key={video.id.videoId}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              
            }}
          >
            <img
              src={video.snippet.thumbnails.default.url}
              alt={video.snippet.title}
              style={{ width: '100%', borderRadius: '4px' }}
            />
            <div className="youtubeInfo" style={{ flex: 1, width: '100%' }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{video.snippet.title}</p>
              <div className='channelProfile'>
              <img
                src={video.channelImage}
                alt={video.snippet.channelTitle}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '0.5rem'
                }}
                />

              <p style={{ margin: '0.25rem 0', fontSize: '13px', color: 'black' }}>{video.snippet.channelTitle}</p>
              <div style={{ fontSize: '12px', color: 'orange', marginTop: '4px', marginLeft: 'auto' }}>
                {formatViews(video.views)} views • {formatDate(video.publishedAt)}
              </div>
              </div>
            </div>
            <button
              onClick={() => addToQueue(video)}
              style={{
                
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgb(204, 0, 0)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%'
                
              }}
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchAndAdd;

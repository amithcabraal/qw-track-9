import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Callback } from './pages/Callback';
import { getStoredAccessToken } from './utils/auth';
import { getCurrentUser, getUserPlaylists, getPlaylistTracks } from './services/spotifyApi';
import { SpotifyPlaylist, SpotifyTrack, SpotifyUser } from './types/spotify';
import { validatePlaylist, validateTrack } from './utils/validators';

function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(err => {
          console.error('Failed to fetch user:', err);
          setError('Failed to load user profile');
        });

      getUserPlaylists()
        .then(data => {
          const validPlaylists = data.items
            .filter(validatePlaylist)
            .map(playlist => ({
              ...playlist,
              name: playlist.name || 'Untitled Playlist',
              images: playlist.images || [],
              tracks: { total: playlist.tracks?.total ?? 0 }
            }));
          setPlaylists(validPlaylists);
        })
        .catch(err => {
          console.error('Failed to fetch playlists:', err);
          setError('Failed to load playlists');
        });
    }
  }, []);

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    try {
      setError(null);
      if (playlist.tracks.total === 0) {
        setError('This playlist is empty');
        setCurrentTrack(null);
        return;
      }

      const response = await getPlaylistTracks(playlist.id);
      const validTracks = response.items
        .map(item => item.track)
        .filter(validateTrack);

      if (validTracks.length === 0) {
        setError('No playable tracks found in this playlist');
        setCurrentTrack(null);
        return;
      }

      const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)];
      setCurrentTrack(randomTrack);
    } catch (err) {
      console.error('Failed to get playlist tracks:', err);
      setError('Failed to load tracks from this playlist');
      setCurrentTrack(null);
    }
  };

  const isAuthenticated = Boolean(getStoredAccessToken());

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Home
                  user={user}
                  playlists={playlists}
                  currentTrack={currentTrack}
                  error={error}
                  onPlaylistSelect={handlePlaylistSelect}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
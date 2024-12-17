import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, X } from 'lucide-react';
import { SpotifyTrack } from '../types/spotify';
import { usePlayer } from '../hooks/usePlayer';
import { calculateSimilarity } from '../utils/similarity';

interface GamePlayerProps {
  track: SpotifyTrack;
  onGameComplete: (score: number) => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({ track, onGameComplete }) => {
  const { isPlaying, playTrack, togglePlayback } = usePlayer();
  const [timer, setTimer] = useState(0);
  const [isGuessing, setIsGuessing] = useState(false);
  const [titleGuess, setTitleGuess] = useState('');
  const [artistGuess, setArtistGuess] = useState('');
  const [result, setResult] = useState<{ score: number; isCorrect: boolean } | null>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    playTrack(track);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [track]);

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      setTimer(prev => prev + 0.1);
    }, 100);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
  };

  const handlePlayPause = async () => {
    await togglePlayback();
    if (!isPlaying) {
      startTimer();
    } else {
      stopTimer();
      setIsGuessing(true);
    }
  };

  const handleSubmitGuess = () => {
    const titleSimilarity = calculateSimilarity(titleGuess, track.name);
    const artistSimilarity = calculateSimilarity(artistGuess, track.artists[0].name);
    
    const averageSimilarity = (titleSimilarity + artistSimilarity) / 2;
    const score = Math.round((1 - timer/30) * averageSimilarity * 100);
    const isCorrect = titleSimilarity > 0.8 && artistSimilarity > 0.8;
    
    setResult({ score: Math.max(0, score), isCorrect });
    onGameComplete(score);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 pt-16">
      <div className="max-w-2xl mx-auto p-4 h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          {!isGuessing ? (
            <div className="text-center">
              <div className="text-6xl font-mono mb-8">
                {timer.toFixed(1)}s
              </div>
              <button
                onClick={handlePlayPause}
                className="p-6 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                {isPlaying ? <Pause size={48} /> : <Play size={48} />}
              </button>
            </div>
          ) : result ? (
            <div className="text-center">
              <div className="mb-8">
                {result.isCorrect ? (
                  <Check size={120} className="mx-auto text-green-500" />
                ) : (
                  <X size={120} className="mx-auto text-red-500" />
                )}
              </div>
              <div className="text-4xl font-bold mb-4">Score: {result.score}</div>
              <div className="space-y-2">
                <p>Correct Title: {track.name}</p>
                <p>Correct Artist: {track.artists[0].name}</p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <input
                type="text"
                placeholder="Song title"
                value={titleGuess}
                onChange={(e) => setTitleGuess(e.target.value)}
                className="w-full p-3 rounded-lg border"
              />
              <input
                type="text"
                placeholder="Artist name"
                value={artistGuess}
                onChange={(e) => setArtistGuess(e.target.value)}
                className="w-full p-3 rounded-lg border"
              />
              <button
                onClick={handleSubmitGuess}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Submit Guess
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
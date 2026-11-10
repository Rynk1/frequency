import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { NowPlayingBar } from './NowPlayingBar';
import { usePlayer } from './PlayerContext';

/**
 * Root-level mount point for the single audio player instance.
 *
 * Rendered once near the app root so playback and its UI survive tab switches
 * and screen unmounts. It renders both the full-screen player (when expanded)
 * and the persistent minimized bar (when collapsed).
 */
export const PlayerHost: React.FC = () => {
  const { isOpen, activeOptions, minimize } = usePlayer();

  return (
    <>
      <NowPlayingBar />
      <AudioPlayer
        visible={isOpen}
        onClose={minimize}
        frequency={activeOptions.frequency}
        sessionFrequencies={activeOptions.session?.frequencies}
        sessionName={activeOptions.session?.name}
        sessionId={activeOptions.session?.sessionId}
        onSessionComplete={activeOptions.onSessionComplete}
        isSessionMode={Boolean(activeOptions.session)}
      />
    </>
  );
};

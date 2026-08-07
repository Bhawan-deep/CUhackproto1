import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Radio,
  Clock,
  Zap,
  AlertTriangle,
  RotateCcw,
  Eye,
  Sliders
} from 'lucide-react';

export default function TimeMachine({
  simulationId,
  currentTick,
  timelineData,
  viewMode, // 'LIVE' | 'REPLAY'
  viewedTick,
  onScrubTick,
  onReturnToLive,
  onOpenCompare,
  onOpenFork,
  isPaused
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [hoveredMarker, setHoveredMarker] = useState(null);
  
  const playIntervalRef = useRef(null);

  const totalTicks = timelineData?.snapshots ? timelineData.snapshots.length : currentTick + 1;
  const maxTick = Math.max(0, currentTick);
  const interventions = timelineData?.interventions || [];

  // Stop playback when viewMode switches to LIVE or reaches maxTick
  useEffect(() => {
    if (viewMode === 'LIVE') {
      setIsPlaying(false);
    }
  }, [viewMode]);

  // Historical UI Playback Loop (UI ONLY - NEVER CALLS /step)
  useEffect(() => {
    if (!isPlaying || viewMode !== 'REPLAY') {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      return;
    }

    const intervalMs = Math.max(250, 1000 / speed);

    playIntervalRef.current = setInterval(() => {
      onScrubTick((prevTick) => {
        if (prevTick >= maxTick) {
          setIsPlaying(false);
          return maxTick;
        }
        return prevTick + 1;
      });
    }, intervalMs);

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, viewMode, speed, maxTick, onScrubTick]);

  const handleSliderChange = (e) => {
    const targetTick = Number(e.target.value);
    setIsPlaying(false);
    onScrubTick(targetTick);
  };

  const handlePrevTick = () => {
    setIsPlaying(false);
    onScrubTick(Math.max(0, (viewedTick !== null ? viewedTick : currentTick) - 1));
  };

  const handleNextTick = () => {
    setIsPlaying(false);
    onScrubTick(Math.min(maxTick, (viewedTick !== null ? viewedTick : currentTick) + 1));
  };

  const handleJumpStart = () => {
    setIsPlaying(false);
    onScrubTick(0);
  };

  const toggleSpeed = () => {
    if (speed === 1) setSpeed(2);
    else if (speed === 2) setSpeed(4);
    else setSpeed(1);
  };

  const isReplay = viewMode === 'REPLAY';
  const displayTick = isReplay ? viewedTick : currentTick;

  return (
    <div className="bg-[#0B111E]/95 border-t border-slate-800 px-6 py-2 flex flex-col gap-2 font-mono text-xs z-30 select-none shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Replay vs Live Indicator */}
        <div className="flex items-center gap-3">
          {isReplay ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded text-amber-300 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>REPLAY MODE — MONTH {displayTick}</span>
              <span className="text-[10px] text-amber-400/70 font-normal">(LIVE: M{currentTick})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded text-emerald-300 font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>● LIVE ECONOMY — MONTH {currentTick}</span>
            </div>
          )}

          {/* Fork Button & Jump to Live Button */}
          {isReplay && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenFork && onOpenFork(displayTick)}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md"
                title={`Fork Parallel Universe from Month ${displayTick}`}
              >
                🔀 FORK FROM M{displayTick}
              </button>

              <button
                onClick={onReturnToLive}
                className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md"
                title="Return to Live Real-Time View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RETURN TO LIVE
              </button>
            </div>
          )}
        </div>

        {/* Replay Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={handleJumpStart}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Jump to Tick 0"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePrevTick}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Previous Tick"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
            }`}
            title={isPlaying ? 'Pause Playback' : 'Play Historical Sequence (UI Only)'}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-sky-400" />}
            {isPlaying ? 'PAUSE' : 'PLAY HISTORY'}
          </button>

          <button
            onClick={handleNextTick}
            disabled={displayTick >= maxTick}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
            title="Next Tick"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleSpeed}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px]"
            title="Playback Speed"
          >
            {speed}x
          </button>
        </div>
      </div>

      {/* Scrubber & Intervention Marker Track */}
      <div className="relative pt-2 pb-1">
        {/* Persisted Intervention Markers */}
        <div className="absolute -top-3 left-0 right-0 h-5 pointer-events-none">
          {interventions.map((marker) => {
            const leftPct = maxTick > 0 ? (marker.tick / maxTick) * 100 : 0;
            const isShock = marker.type === 'shock';

            return (
              <div
                key={marker.id || marker.tick}
                style={{ left: `${Math.min(98, Math.max(1, leftPct))}%` }}
                className="absolute -translate-x-1/2 pointer-events-auto cursor-pointer group"
                onClick={() => {
                  onScrubTick(marker.tick);
                  if (onOpenCompare) onOpenCompare(marker);
                }}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 shadow-md transition-transform hover:scale-110 ${
                  isShock ? 'bg-amber-950 text-amber-300 border-amber-500/60' : 'bg-sky-950 text-sky-300 border-sky-500/60'
                }`}>
                  {isShock ? <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> : <Zap className="w-2.5 h-2.5 text-sky-400" />}
                  <span>M{marker.tick}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Range Slider Scrubber Input */}
        <input
          type="range"
          min="0"
          max={maxTick}
          value={displayTick}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />

        {/* Adaptive Tick Grid Labels */}
        <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
          <span>M0</span>
          {maxTick >= 10 && <span>M{Math.round(maxTick * 0.25)}</span>}
          {maxTick >= 20 && <span>M{Math.round(maxTick * 0.5)}</span>}
          {maxTick >= 30 && <span>M{Math.round(maxTick * 0.75)}</span>}
          <span className="text-sky-400 font-bold">M{maxTick} (Latest)</span>
        </div>
      </div>

      {/* Marker Hover Popover */}
      {hoveredMarker && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono shadow-2xl space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-sky-400">
            {hoveredMarker.type === 'shock' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> : <Sliders className="w-3.5 h-3.5 text-sky-400" />}
            <span>{hoveredMarker.name} (Month {hoveredMarker.tick})</span>
          </div>
          <p className="text-[10px] text-slate-300">{hoveredMarker.detail}</p>
          <span className="text-[9px] text-slate-500 block">Click marker to jump to Month {hoveredMarker.tick} and compare impact</span>
        </div>
      )}
    </div>
  );
}

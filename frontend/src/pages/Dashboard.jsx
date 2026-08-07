import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Cpu, Radio, Clock, Settings, Activity, AlertTriangle, Zap, Eye } from 'lucide-react';
import {
  getHealthStatus,
  getSimulations,
  createSimulation,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  updatePolicy,
  injectEvent,
  getWorldState,
  getTimeline,
  getSnapshotWorld
} from '../api/simulations';
import { useSimulationSocket } from '../hooks/useSimulationSocket';
import { createBaselineSnapshot, computeImpactDeltas } from '../utils/impactTracker';

import MetricStrip from '../components/world/MetricStrip';
import SimulationSelector from '../components/world/SimulationSelector';
import SimulationControls from '../components/world/SimulationControls';
import EconomicWorld from '../components/world/EconomicWorld';
import InterventionLab from '../components/lab/InterventionLab';
import ImpactSummaryModal from '../components/lab/ImpactSummaryModal';
import TimeMachine from '../components/timeline/TimeMachine';
import HistoricalCompareModal from '../components/timeline/HistoricalCompareModal';
import CounterfactualLabModal from '../components/experiment/CounterfactualLabModal';
import ParallelUniverse from '../components/experiment/ParallelUniverse';
import { createExperiment, runExperiment } from '../api/experiments';


export default function Dashboard() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const [simulations, setSimulations] = useState([]);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  
  const [isLoadingSimulations, setIsLoadingSimulations] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Intervention Lab & Impact State
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isImpactSummaryOpen, setIsImpactSummaryOpen] = useState(false);
  const [impactMode, setImpactMode] = useState(false);
  const [activeBaseline, setActiveBaseline] = useState(null);
  const [interventionHistory, setInterventionHistory] = useState([]);

  // Phase 6 Time Machine & Replay State
  const [viewMode, setViewMode] = useState('LIVE'); // 'LIVE' | 'REPLAY'
  const [viewedTick, setViewedTick] = useState(null);
  const [replayWorld, setReplayWorld] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [compareMarker, setCompareMarker] = useState(null);
  const [showPausePrompt, setShowPausePrompt] = useState(false);
  const [pendingScrubTick, setPendingScrubTick] = useState(null);

  // Phase 7 Counterfactual Experiment State
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [forkTick, setForkTick] = useState(null);
  const [experimentResult, setExperimentResult] = useState(null);

  // Snapshot Cache & Race Condition Protection
  const snapshotCacheRef = useRef(new Map());
  const requestSeqRef = useRef(0);

  const handleOpenForkModal = (targetTick) => {
    setForkTick(targetTick !== undefined ? targetTick : (viewedTick !== null ? viewedTick : currentTick));
    setIsForkModalOpen(true);
  };

  const handleLaunchExperiment = async (payload) => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    try {
      const exp = await createExperiment(selectedSimulation.id, {
        source_tick: payload.source_tick,
        horizon_ticks: payload.horizon_ticks
      });

      const result = await runExperiment(exp.id, {
        horizon_ticks: payload.horizon_ticks,
        variant_policy: payload.variant_policy,
        variant_event: payload.variant_event
      });

      setIsForkModalOpen(false);
      setExperimentResult(result);
    } catch (err) {
      setActionError(err.message || 'Failed to execute counterfactual experiment.');
    } finally {
      setIsActionPending(false);
    }
  };


  // Real-time WebSocket hook per selected simulation
  const { connectionState, liveState } = useSimulationSocket(selectedSimulation?.id);

  // Load initial health & simulations list
  const checkHealthAndLoad = useCallback(async () => {
    setIsCheckingHealth(true);
    setHealthError(null);

    try {
      await getHealthStatus();
      setIsBackendConnected(true);
      
      setIsLoadingSimulations(true);
      try {
        const list = await getSimulations();
        setSimulations(list);
        if (list.length > 0) {
          setSelectedSimulation(list[0]);
        } else {
          setSelectedSimulation(null);
        }
      } catch (err) {
        setActionError(err.message || 'Failed to fetch simulations from database.');
      } finally {
        setIsLoadingSimulations(false);
      }
    } catch (err) {
      setIsBackendConnected(false);
      setHealthError(err.message || 'Backend connection failed.');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealthAndLoad();
  }, [checkHealthAndLoad]);

  // Synchronize live WebSocket tick & status into selected simulation object
  useEffect(() => {
    if (liveState && selectedSimulation) {
      const updatedSim = {
        ...selectedSimulation,
        current_tick: liveState.tick !== undefined ? liveState.tick : selectedSimulation.current_tick,
        status: liveState.status || selectedSimulation.status
      };
      setSelectedSimulation(updatedSim);
      setSimulations(prev => prev.map(s => s.id === updatedSim.id ? updatedSim : s));
    }
  }, [liveState]);

  // Fetch lightweight timeline metadata whenever selected simulation or current_tick changes
  const currentTick = liveState?.tick !== undefined ? liveState.tick : (selectedSimulation?.current_tick || 0);

  const fetchTimeline = useCallback(async () => {
    if (!selectedSimulation) return;
    try {
      const data = await getTimeline(selectedSimulation.id);
      setTimelineData(data);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch timeline metadata:', err);
    }
  }, [selectedSimulation?.id]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline, currentTick]);

  // Reset baseline, history, and snapshot cache when selected simulation changes
  useEffect(() => {
    setActiveBaseline(null);
    setInterventionHistory([]);
    setImpactMode(false);
    setIsImpactSummaryOpen(false);
    setViewMode('LIVE');
    setViewedTick(null);
    setReplayWorld(null);
    snapshotCacheRef.current.clear();
  }, [selectedSimulation?.id]);

  // Load historical snapshot with race condition protection & local caching
  const loadHistoricalSnapshot = useCallback(async (targetTick) => {
    if (!selectedSimulation) return;

    const cacheKey = `${selectedSimulation.id}:${targetTick}`;
    if (snapshotCacheRef.current.has(cacheKey)) {
      setReplayWorld(snapshotCacheRef.current.get(cacheKey));
      setViewedTick(targetTick);
      setViewMode('REPLAY');
      return;
    }

    const currentSeq = ++requestSeqRef.current;

    try {
      const historicalWorld = await getSnapshotWorld(selectedSimulation.id, targetTick);
      if (currentSeq === requestSeqRef.current) {
        snapshotCacheRef.current.set(cacheKey, historicalWorld);
        setReplayWorld(historicalWorld);
        setViewedTick(targetTick);
        setViewMode('REPLAY');
      }
    } catch (err) {
      console.error(`[Dashboard] Failed to fetch historical snapshot for tick ${targetTick}:`, err);
    }
  }, [selectedSimulation?.id]);

  // Handle Scrubbing Request with Pause Confirmation Prompt if RUNNING
  const handleScrubTick = useCallback((targetTickOrUpdater) => {
    const targetTick = typeof targetTickOrUpdater === 'function' ? targetTickOrUpdater(viewedTick !== null ? viewedTick : currentTick) : targetTickOrUpdater;
    const status = liveState?.status || selectedSimulation?.status || 'created';

    if (status === 'running') {
      setPendingScrubTick(targetTick);
      setShowPausePrompt(true);
      return;
    }

    loadHistoricalSnapshot(targetTick);
  }, [liveState, selectedSimulation, viewedTick, currentTick, loadHistoricalSnapshot]);

  // Confirm Pause & Explore Replay
  const handleConfirmPauseAndExplore = async () => {
    setShowPausePrompt(false);
    if (!selectedSimulation) return;
    setIsActionPending(true);
    try {
      await pauseSimulation(selectedSimulation.id);
      if (pendingScrubTick !== null) {
        loadHistoricalSnapshot(pendingScrubTick);
        setPendingScrubTick(null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to pause simulation for replay.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReturnToLive = () => {
    setViewMode('LIVE');
    setViewedTick(null);
    setReplayWorld(null);
  };

  // Derive Display World & Metrics (LIVE vs REPLAY)
  const displayWorld = useMemo(() => {
    if (viewMode === 'REPLAY' && replayWorld) {
      return replayWorld;
    }
    return liveState?.world_summary || null;
  }, [viewMode, replayWorld, liveState]);

  const displayMetrics = useMemo(() => {
    if (viewMode === 'REPLAY' && replayWorld?.metrics) {
      return replayWorld.metrics;
    }
    return liveState?.metrics || null;
  }, [viewMode, replayWorld, liveState]);

  // Calculate live impact deltas when baseline & live state exist
  const impactDeltas = useMemo(() => {
    if (!activeBaseline || !displayWorld || !displayMetrics) return null;
    return computeImpactDeltas(displayMetrics, displayWorld, activeBaseline, null);
  }, [activeBaseline, displayWorld, displayMetrics]);

  const handleCreateDemoSimulation = async () => {
    setIsCreating(true);
    setActionError(null);

    try {
      const newSim = await createSimulation({
        name: "Demo Economy",
        random_seed: 42
      });
      setSimulations(prev => [newSim, ...prev]);
      setSelectedSimulation(newSim);
    } catch (err) {
      setActionError(err.message || 'Failed to create simulation record.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStart = async () => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);
    try {
      await startSimulation(selectedSimulation.id);
    } catch (err) {
      setActionError(err.message || 'Failed to start simulation runner.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePause = async () => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);
    try {
      await pauseSimulation(selectedSimulation.id);
    } catch (err) {
      setActionError(err.message || 'Failed to pause simulation.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleResume = async () => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);
    try {
      await resumeSimulation(selectedSimulation.id);
    } catch (err) {
      setActionError(err.message || 'Failed to resume simulation.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleStep = async () => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);

    try {
      await stepSimulation(selectedSimulation.id);
      fetchTimeline();
    } catch (err) {
      setActionError(err.message || 'Failed to step simulation.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReset = async () => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);

    try {
      await resetSimulation(selectedSimulation.id);
      setActiveBaseline(null);
      setInterventionHistory([]);
      setImpactMode(false);
      setViewMode('LIVE');
      setViewedTick(null);
      setReplayWorld(null);
      snapshotCacheRef.current.clear();
      fetchTimeline();
    } catch (err) {
      setActionError(err.message || 'Failed to reset simulation.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Pre-Intervention Baseline Capture & Policy Application
  const handleApplyPolicy = async (policyData) => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);

    try {
      const worldData = await getWorldState(selectedSimulation.id);
      const taxPct = Math.round(policyData.tax_rate * 100);
      const infraK = Math.round(policyData.infrastructure_spending / 1000);
      
      const info = {
        type: 'policy',
        name: `Policy Update (Tax ${taxPct}%, Infra $${infraK}k)`,
        detail: `Tax ${taxPct}%, Infra $${infraK}k/mo`,
        appliedTick: currentTick
      };

      const newBaseline = createBaselineSnapshot(currentTick, displayMetrics, worldData, info);
      setActiveBaseline(newBaseline);
      setInterventionHistory(prev => [info, ...prev]);
      setImpactMode(true);

      await updatePolicy(selectedSimulation.id, policyData);
      fetchTimeline();

    } catch (err) {
      setActionError(err.message || 'Failed to update policy.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Pre-Intervention Baseline Capture & Event Injection
  const handleInjectShock = async (eventData) => {
    if (!selectedSimulation) return;
    setIsActionPending(true);
    setActionError(null);

    try {
      const worldData = await getWorldState(selectedSimulation.id);
      const sevLabel = (eventData.severity * 100).toFixed(0);
      const eventName = eventData.type.toUpperCase().replace('_', ' ');

      const info = {
        type: 'shock',
        name: `${eventName} Shock`,
        detail: `Severity ${sevLabel}%`,
        appliedTick: currentTick
      };

      const newBaseline = createBaselineSnapshot(currentTick, displayMetrics, worldData, info);
      setActiveBaseline(newBaseline);
      setInterventionHistory(prev => [info, ...prev]);
      setImpactMode(true);

      await injectEvent(selectedSimulation.id, eventData);
      fetchTimeline();

    } catch (err) {
      setActionError(err.message || 'Failed to inject shock event.');
    } finally {
      setIsActionPending(false);
    }
  };

  const status = liveState?.status || selectedSimulation?.status || "created";
  const isRunning = status === "running";

  return (
    <div className="h-screen flex flex-col bg-[#090D16] text-slate-100 font-sans overflow-hidden">

      {/* Top Main Application Header */}
      <header className="bg-[#0B111E] border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20">
        {/* Brand & Live Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-100 tracking-wide uppercase">Agent Economy Digital Twin</h1>
              <span className="text-[10px] text-slate-400 font-mono">MACROECONOMIC INTERACTION & TIME MACHINE SIMULATOR</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          {/* WebSocket Diagnostic Stream Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-xs font-mono">
            <Radio className={`w-3 h-3 ${connectionState === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400 text-[10px]">LIVE STREAM:</span>
            <span className={`font-semibold text-[10px] ${
              connectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {connectionState}
            </span>
          </div>
        </div>

        {/* Header Controls & Compact Selector */}
        <div className="flex items-center gap-3">
          {/* Tick Indicator */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">MONTH</span>
            <span className="font-bold text-white text-sm">{viewMode === 'REPLAY' ? viewedTick : currentTick}</span>
            {viewMode === 'REPLAY' && <span className="text-[9px] text-amber-400 font-bold ml-1">(REPLAY)</span>}
            {isRunning && viewMode === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />}
          </div>

          {/* Compact Simulation Selector */}
          {simulations.length > 0 && (
            <SimulationSelector
              simulations={simulations}
              selectedSimulation={selectedSimulation}
              onSelect={setSelectedSimulation}
              onCreateNew={handleCreateDemoSimulation}
              isCreating={isCreating}
            />
          )}

          {/* Compact Lifecycle Control Action Buttons */}
          <SimulationControls
            status={status}
            isPending={isActionPending}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStep={handleStep}
            onReset={handleReset}
          />
        </div>
      </header>

      {/* Metric Strip Header Bar */}
      <MetricStrip metrics={displayMetrics} />

      {/* Active Intervention Banner / Indicator */}
      {activeBaseline && activeBaseline.interventionInfo && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-6 py-1.5 text-xs font-mono flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold uppercase">{activeBaseline.interventionInfo.name}</span>
            <span className="text-slate-400">|</span>
            <span>Applied Month {activeBaseline.appliedTick}</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-400 font-bold">Observing Month {currentTick} (+{Math.max(0, currentTick - activeBaseline.appliedTick)} months)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setImpactMode(!impactMode)}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition-all ${
                impactMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-amber-400 border-amber-500/40'
              }`}
            >
              Impact Mode: {impactMode ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setIsImpactSummaryOpen(true)}
              className="px-2 py-0.5 rounded bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-600 text-[10px] font-bold uppercase flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Impact Summary
            </button>
          </div>
        </div>
      )}

      {/* Main Screen: Interactive Economic World Canvas & Overlay Action Buttons */}
      <main className="flex-1 relative overflow-hidden bg-[#090D16]">
        {isLoadingSimulations ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 font-mono text-xs">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <p>Querying backend database for active simulations...</p>
          </div>
        ) : simulations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 font-mono">
            <Cpu className="w-12 h-12 text-sky-400" />
            <h3 className="text-base text-slate-200 font-bold">No Simulation Initialized</h3>
            <p className="text-xs text-slate-400 max-w-sm">Create a demo economic simulation to launch the digital twin.</p>
            <button
              onClick={handleCreateDemoSimulation}
              disabled={isCreating}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold"
            >
              Create Demo Economy
            </button>
          </div>
        ) : (
          selectedSimulation && (
            <>
              {/* Floating Intervention Drawer Trigger Button */}
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                <button
                  onClick={() => setIsLabOpen(true)}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-xl border border-sky-400/40 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  ⚙ INTERVENE
                </button>
              </div>

              {/* Core React Flow Economic World */}
              <EconomicWorld
                simulationId={selectedSimulation.id}
                liveState={liveState}
                displayWorld={displayWorld}
                baseline={activeBaseline}
                impactDeltas={impactDeltas}
                impactMode={impactMode}
                viewMode={viewMode}
                viewedTick={viewedTick}
              />
            </>
          )
        )}

        {/* Intervention Lab Side Drawer */}
        {isLabOpen && (
          <InterventionLab
            currentPolicy={liveState?.policy}
            onApplyPolicy={handleApplyPolicy}
            onInjectShock={handleInjectShock}
            interventionHistory={interventionHistory}
            isPending={isActionPending}
            onClose={() => setIsLabOpen(false)}
          />
        )}

        {/* Impact Summary Side Drawer */}
        {isImpactSummaryOpen && (
          <ImpactSummaryModal
            baseline={activeBaseline}
            impactDeltas={impactDeltas}
            currentTick={currentTick}
            onClose={() => setIsImpactSummaryOpen(false)}
          />
        )}

        {/* Historical Compare Side Modal */}
        {compareMarker && selectedSimulation && (
          <HistoricalCompareModal
            simulationId={selectedSimulation.id}
            marker={compareMarker}
            currentTick={currentTick}
            onClose={() => setCompareMarker(null)}
          />
        )}

        {/* Pause Confirmation Modal when scrubbing while RUNNING */}
        {showPausePrompt && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono text-xs">
            <div className="bg-[#0B111E] border border-amber-500/60 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Pause Simulation for Replay?</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The simulation runner is currently <strong>RUNNING</strong>. Entering historical replay requires pausing the runner so automatic background ticks do not disturb your historical exploration.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => { setShowPausePrompt(false); setPendingScrubTick(null); }}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPauseAndExplore}
                  disabled={isActionPending}
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  Pause & Explore
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Phase 7 Counterfactual Lab Modal */}
        {isForkModalOpen && selectedSimulation && (
          <CounterfactualLabModal
            sourceSimId={selectedSimulation.id}
            sourceTick={forkTick !== null ? forkTick : (viewedTick !== null ? viewedTick : currentTick)}
            sourceWorld={displayWorld}
            onLaunchExperiment={handleLaunchExperiment}
            onClose={() => setIsForkModalOpen(false)}
          />
        )}

        {/* Phase 7 Parallel Universe Results Overlay */}
        {experimentResult && (
          <ParallelUniverse
            experimentResult={experimentResult}
            onClose={() => setExperimentResult(null)}
          />
        )}
      </main>

      {/* Phase 6 Time Machine Bottom Timeline Scrubber */}
      {selectedSimulation && (
        <TimeMachine
          simulationId={selectedSimulation.id}
          currentTick={currentTick}
          timelineData={timelineData}
          viewMode={viewMode}
          viewedTick={viewedTick}
          onScrubTick={handleScrubTick}
          onReturnToLive={handleReturnToLive}
          onOpenCompare={setCompareMarker}
          onOpenFork={handleOpenForkModal}
          isPaused={!isRunning}
        />
      )}
    </div>
  );
}


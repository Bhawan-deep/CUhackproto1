import { useState, useEffect, useRef } from 'react';

const WS_BASE_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000').replace(/^http/, 'ws');

export function useSimulationSocket(simulationId) {
  const [connectionState, setConnectionState] = useState('DISCONNECTED'); // CONNECTED, CONNECTING, DISCONNECTED
  const [liveState, setLiveState] = useState(null);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!simulationId) {
      setConnectionState('DISCONNECTED');
      setLiveState(null);
      return;
    }

    let isMounted = true;

    const connect = () => {
      // Clear any pending reconnect timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close existing socket cleanly
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setConnectionState('CONNECTING');

      const wsUrl = `${WS_BASE_URL}/api/simulations/ws/${simulationId}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionState('CONNECTED');
        retryCountRef.current = 0; // Reset backoff count on successful connection
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'initial_state') {
            setLiveState({
              tick: data.tick,
              status: data.status,
              metrics: data.metrics,
              policy: data.policy,
              active_events: data.active_events || [],
              world_summary: data.world_summary || null
            });
          } else if (data.type === 'tick') {
            setLiveState(prev => ({
              ...prev,
              tick: data.tick,
              status: data.status || prev?.status,
              metrics: data.metrics || prev?.metrics,
              policy: data.policy || prev?.policy,
              active_events: data.active_events || prev?.active_events,
              world_summary: data.world_summary || prev?.world_summary
            }));
          } else if (data.type === 'lifecycle') {
            setLiveState(prev => ({
              ...prev,
              status: data.status,
              tick: data.tick !== undefined ? data.tick : prev?.tick
            }));
          } else if (data.type === 'reset') {
            setLiveState({
              tick: data.tick,
              status: data.status,
              metrics: data.metrics,
              policy: prev => prev?.policy,
              active_events: [],
              world_summary: data.world_summary
            });
          } else if (data.type === 'policy_updated') {
            setLiveState(prev => ({
              ...prev,
              policy: data.policy
            }));
          } else if (data.type === 'event_injected') {
            setLiveState(prev => ({
              ...prev,
              active_events: [...(prev?.active_events || []), data.event]
            }));
          }
        } catch (err) {
          console.error('[WebSocket] Message parsing error:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionState('DISCONNECTED');
        
        // Bounded reconnect attempt (up to 5 retries with backoff)
        if (retryCountRef.current < 5) {
          const delay = Math.min(5000, 1000 * Math.pow(1.5, retryCountRef.current));
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [simulationId]);

  return { connectionState, liveState };
}

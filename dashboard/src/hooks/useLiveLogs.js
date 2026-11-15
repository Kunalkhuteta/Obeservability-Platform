import { useState, useEffect, useRef } from 'react';

// Connects to the WebSocket and streams live logs into a buffer
// maxLogs: how many entries to keep in memory (oldest get dropped)
export function useLiveLogs(maxLogs = 200) {
  const [logs,      setLogs]      = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    let active = true;
    let reconnectTimer = null;

    function connect() {
      if (!active) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const WS_URL = `${proto}//${window.location.host}/ws/logs`;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setConnected(true);
        console.log('[ws] connected to live log stream');
      };

      ws.onmessage = (evt) => {
        if (!active) return;
        const entry = JSON.parse(evt.data);
        setLogs((prev) => {
          const next = [entry, ...prev];
          return next.length > maxLogs ? next.slice(0, maxLogs) : next;
        });
      };

      ws.onclose = () => {
        if (!active) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [maxLogs]);

  return { logs, connected };
}

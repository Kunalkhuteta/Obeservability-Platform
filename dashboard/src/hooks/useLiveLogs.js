import { useState, useEffect, useRef } from 'react';

// Connects to the WebSocket and streams live logs into a buffer
// maxLogs: how many entries to keep in memory (oldest get dropped)
export function useLiveLogs(maxLogs = 200) {
  const [logs,      setLogs]      = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Rely on window.location.host to grab the active minikube port, NGINX handles routing the /ws/ prefix
    const WS_URL = `ws://${window.location.host}/ws/logs`;
    const ws     = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('[ws] connected to live log stream');
    };

    ws.onmessage = (evt) => {
      const entry = JSON.parse(evt.data);
      setLogs((prev) => {
        const next = [entry, ...prev];        // prepend newest
        return next.length > maxLogs ? next.slice(0, maxLogs) : next;
      });
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, []);

  return { logs, connected };
}

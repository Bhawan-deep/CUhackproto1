import asyncio
import json
from typing import Dict, Set, Any
from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect


class WebSocketConnectionManager:
    """
    In-memory WebSocket manager maintaining client connections per simulation UUID.
    Provides multi-simulation isolation, safe fault tolerance against dead sockets,
    and thread-safe async broadcasting.
    """

    def __init__(self):
        self._active_connections: Dict[UUID, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, simulation_id: UUID, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection under simulation_id."""
        await websocket.accept()
        async with self._lock:
            if simulation_id not in self._active_connections:
                self._active_connections[simulation_id] = set()
            self._active_connections[simulation_id].add(websocket)
        print(f"[WebSocketManager] Client connected to simulation '{simulation_id}'. Total for sim: {len(self._active_connections[simulation_id])}")

    async def disconnect(self, simulation_id: UUID, websocket: WebSocket) -> None:
        """Unregister a WebSocket connection."""
        async with self._lock:
            if simulation_id in self._active_connections:
                self._active_connections[simulation_id].discard(websocket)
                if not self._active_connections[simulation_id]:
                    del self._active_connections[simulation_id]
        print(f"[WebSocketManager] Client disconnected from simulation '{simulation_id}'")

    async def broadcast(self, simulation_id: UUID, message: Dict[str, Any]) -> None:
        """
        Broadcast a JSON message to all clients connected to simulation_id.
        Fault-tolerant: dead/broken sockets are removed cleanly without failing other clients
        or stopping the background simulation runner.
        """
        async with self._lock:
            sockets = list(self._active_connections.get(simulation_id, set()))

        if not sockets:
            return

        message_text = json.dumps(message)
        dead_sockets: Set[WebSocket] = set()

        for socket in sockets:
            try:
                await socket.send_text(message_text)
            except Exception as e:
                print(f"[WebSocketManager Warning] Failed sending to socket on sim '{simulation_id}': {e}")
                dead_sockets.add(socket)

        if dead_sockets:
            async with self._lock:
                if simulation_id in self._active_connections:
                    self._active_connections[simulation_id].difference_update(dead_sockets)
                    if not self._active_connections[simulation_id]:
                        del self._active_connections[simulation_id]

    def connection_count(self, simulation_id: UUID) -> int:
        """Return count of active connections for a simulation."""
        return len(self._active_connections.get(simulation_id, set()))


# Global singleton instance
ws_manager = WebSocketConnectionManager()

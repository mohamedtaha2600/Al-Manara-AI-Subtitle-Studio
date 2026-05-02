"""
WebSocket Connection Manager
مدير اتصالات WebSocket

Manages WebSocket connections for real-time progress updates.
"""

from fastapi import WebSocket
from typing import List, Dict
import json
import asyncio


class ConnectionManager:
    """
    Manages WebSocket connections for broadcasting real-time updates.
    
    Features:
    - Multiple simultaneous connections
    - Job-specific channels
    - Broadcast and personal messaging
    """
    
    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: List[WebSocket] = []
        self.job_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, job_id: str = None):
        """
        Accept a new WebSocket connection.
        
        Args:
            websocket: The WebSocket connection
            job_id: Optional job ID to subscribe to
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if job_id:
            if job_id not in self.job_connections:
                self.job_connections[job_id] = []
            self.job_connections[job_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from all job subscriptions
        for job_id in self.job_connections:
            if websocket in self.job_connections[job_id]:
                self.job_connections[job_id].remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send message to a specific connection.
        
        Args:
            message: Message to send
            websocket: Target connection
        """
        try:
            await websocket.send_text(message)
        except Exception:
            self.disconnect(websocket)
    
    async def send_json(self, data: dict, websocket: WebSocket):
        """
        Send JSON data to a specific connection.
        
        Args:
            data: Data to send as JSON
            websocket: Target connection
        """
        try:
            await websocket.send_json(data)
        except Exception:
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """
        Broadcast message to all connected clients.
        
        Args:
            message: Message to broadcast
        """
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_json(self, data: dict):
        """
        Broadcast JSON data to all connected clients.
        
        Args:
            data: Data to broadcast as JSON
        """
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_to_job(self, job_id: str, data: dict):
        """
        Broadcast to clients subscribed to a specific job.
        
        Args:
            job_id: The job ID to broadcast to
            data: Data to broadcast
        """
        if job_id not in self.job_connections:
            return
        
        disconnected = []
        for connection in self.job_connections[job_id]:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_progress(
        self,
        job_id: str,
        progress: float,
        message: str,
        status: str = "processing"
    ):
        """
        Send progress update for a job.
        
        Args:
            job_id: Job identifier
            progress: Progress percentage (0-100)
            message: Status message
            status: Job status
        """
        data = {
            "type": "progress",
            "job_id": job_id,
            "progress": progress,
            "message": message,
            "status": status
        }
        
        # Broadcast to job subscribers and all connections
        await self.broadcast_json(data)
    
    async def send_log(
        self,
        message: str,
        level: str = "info",
        job_id: str = None
    ):
        """
        Send log message to clients.
        
        Args:
            message: Log message
            level: Log level (info, success, warning, error)
            job_id: Optional job ID
        """
        data = {
            "type": "log",
            "level": level,
            "message": message,
            "job_id": job_id
        }
        
        await self.broadcast_json(data)
    
    def get_connection_count(self) -> int:
        """Get number of active connections."""
        return len(self.active_connections)

"""WebSocket endpoint for real-time bidirectional updates.

When a customer books a class or makes a payment, Gina's admin dashboard
updates instantly. When Gina approves a booking or enrollment, the customer
sees the change immediately — no page refresh needed.

Architecture:
  - Each connected client joins a "room" based on their user_id.
  - Admin clients also join an "admin" room.
  - When an event occurs (booking, enrollment, etc.), the server broadcasts
    to the relevant rooms.
  - Uses FastAPI WebSocket with a ConnectionManager for tracking connections.
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List
from app.services.auth import decode_token

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections organized by user rooms."""

    def __init__(self):
        # user_id -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # admin room connections
        self.admin_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: str, is_admin: bool = False):
        """Accept and store a WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        if is_admin:
            self.admin_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str, is_admin: bool = False):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws is not websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if is_admin and websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a specific user."""
        connections = self.active_connections.get(user_id, [])
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass  # Connection may have dropped

    async def send_to_admins(self, message: dict):
        """Send a message to all admin connections."""
        for connection in self.admin_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for real-time updates.
    
    Connect with: ws://host/realtime/ws?token=<jwt_token>
    
    The server authenticates the token, then sends real-time events:
    - booking_created, booking_approved, booking_denied
    - enrollment_created, enrollment_approved, enrollment_waitlisted
    - assessment_completed
    - payment_completed, payment_failed
    - notification (general notifications)
    
    Client can also send messages (e.g., typing indicators for chat).
    """
    # Authenticate the token
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    role = payload.get("role")
    is_admin = role == "admin"

    await manager.connect(websocket, user_id, is_admin)
    
    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "user_id": user_id,
        "role": role,
        "message": "Real-time connection established",
    })

    try:
        while True:
            # Receive messages from client (for future features like chat)
            data = await websocket.receive_text()
            # For now, just echo back — can be extended for chat features
            try:
                message = json.loads(data)
                # Handle incoming messages if needed
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, is_admin)


# ── Helper functions to send events from other routers ──────────────────────

async def notify_user(user_id: str, event_type: str, data: dict):
    """Send a real-time event to a specific user."""
    message = {"type": event_type, **data}
    await manager.send_to_user(user_id, message)


async def notify_admins(event_type: str, data: dict):
    """Send a real-time event to all admin connections."""
    message = {"type": event_type, **data}
    await manager.send_to_admins(message)


async def notify_all(event_type: str, data: dict):
    """Broadcast a real-time event to all connections."""
    message = {"type": event_type, **data}
    await manager.broadcast(message)
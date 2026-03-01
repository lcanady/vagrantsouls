export class WebSocketService {
  private connections: Map<string, Set<WebSocket>> = new Map();

  addConnection(partyId: string, ws: WebSocket) {
    if (!this.connections.has(partyId)) {
      this.connections.set(partyId, new Set());
    }
    this.connections.get(partyId)!.add(ws);
    
    ws.onclose = () => {
      const set = this.connections.get(partyId);
      if (set) {
          set.delete(ws);
          if (set.size === 0) {
              this.connections.delete(partyId);
          }
      }
    };
    
    ws.onerror = (e) => {
        console.error("WebSocket Error:", e);
    };
  }

  broadcast(partyId: string, message: unknown) {
    const clients = this.connections.get(partyId);
    if (clients) {
      const data = JSON.stringify(message);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    }
  }
}

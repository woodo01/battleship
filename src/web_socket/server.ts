import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { MessageHandler } from "./messageHandler";

class WSServer {
  private messageHandler = new MessageHandler();

  startServer(port: number) {
    (new WebSocketServer({ port })).on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clients = new Map<string, WebSocket>();
      const clientId = (clients.size + 1).toString();
      clients.set(clientId, ws);
      console.log(`Client connected: ${clientId}`);

      ws.on('message', (message: string) => {
        this.messageHandler.handleMessage(ws, message);
        console.log(`Received message from ${clientId}: ${message}`);
      });

      ws.on('close', () => {
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });
    });

    console.log(`WebSocket server started on ws://localhost: ${port}`);
  }
}

export { WSServer };

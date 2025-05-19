import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { MessageHandler } from "./messageHandler";

class WSServer {
  private messageHandler = new MessageHandler();
  public static clients = new Map<string, WebSocket>();
  public static connectionCounter = 0;

  startServer(port: number) {
    (new WebSocketServer({ port })).on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = (WSServer.connectionCounter++).toString();
      WSServer.clients.set(clientId, ws);
      console.log(`Client connected: ${clientId}`);

      ws.on('message', (message: string) => {
        this.messageHandler.handleMessage(ws, message, clientId);
        console.log(`Received message from ${clientId}: ${message}`);
      });

      ws.on('close', () => {
        WSServer.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });
    });

    console.log(`WebSocket server started on ws://localhost: ${port}`);
  }
}

export { WSServer };

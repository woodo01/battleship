import { WebSocket } from "ws";
import { createMessage, IMessage } from "./message";

export class Messenger {
  sendMessage(ws: WebSocket, message: IMessage) {
    ws.send(JSON.stringify({ ...message, data: JSON.stringify(message.data) }));
  }

  sendError(ws: WebSocket, errorText: string, clientId: string, userName: string) {
    this.sendMessage(ws, createMessage({type: "error", data: { userName, clientId, error: true, errorText }}));
  }
}

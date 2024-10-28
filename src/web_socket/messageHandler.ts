import { WebSocket } from 'ws';
import { IMessage, MESSAGE_TYPES } from "../shared/message";

class MessageHandler {
  handleMessage(ws: WebSocket, message: string) {
    try {
      const msg: IMessage = JSON.parse(message);
      switch (msg.type) {
        case MESSAGE_TYPES.REGISTRATION:
          break;
        case MESSAGE_TYPES.SINGLE_PLAY:
          break;
        case MESSAGE_TYPES.CREATE_ROOM:
          break;
        case MESSAGE_TYPES.ADD_USER_TO_ROOM:
          break;
        case MESSAGE_TYPES.ADD_SHIPS:
          break;
        case MESSAGE_TYPES.ATTACK:
          break;
        default:
          console.error(`Undefined message: ${msg}`);
          break;
      }
    } catch (error) {
      console.error(`Error handling message: ${error}`);
    }
  }
}

export {MessageHandler};

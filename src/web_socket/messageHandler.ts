import { WebSocket } from 'ws';
import { IMessage, MESSAGE_TYPES } from "../shared/message";
import { RegistrationHandler } from "../handlers/registrationHandler";
import { Messenger } from "../shared/messenger";
import { RoomHandler } from "../handlers/roomHandler";
import { PlayerRepository } from "../storage/playerRepository";
import { RoomRepository } from "../storage/roomRepository";

class MessageHandler {
  messenger = new Messenger();
  playerRepository = new PlayerRepository();
  roomRepository = new RoomRepository();
  registrationHandler = new RegistrationHandler(this.playerRepository);
  roomHandler = new RoomHandler(this.roomRepository, this.playerRepository);

  handleMessage(ws: WebSocket, message: string, clientId: string) {
    const msg: IMessage = JSON.parse(message);
    const { type, data } = msg;

    try {
      const msg: IMessage = JSON.parse(message);
      switch (type) {
        case MESSAGE_TYPES.REGISTRATION:
          this.registrationHandler.handle(ws, data, clientId);
          break;
        case MESSAGE_TYPES.SINGLE_PLAY:
          break;
        case MESSAGE_TYPES.CREATE_ROOM:
          this.roomHandler.createRoom(clientId);
          break;
        case MESSAGE_TYPES.ADD_USER_TO_ROOM:
          this.roomHandler.addUserToRoom(ws, data, clientId);
          break;
        case MESSAGE_TYPES.ADD_SHIPS:
          break;
        case MESSAGE_TYPES.ATTACK:
          break;
        default:
          this.messenger.sendError(ws, `Undefined message: ${msg}`, clientId, '')
          console.error(`Undefined message: ${msg}`);
          break;
      }
    } catch (error) {
      this.messenger.sendError(ws, `Error handling message: ${error}`, clientId, '')
      console.error(`Error handling message: ${error}`);
    }
  }
}

export {MessageHandler};

import { WebSocket } from "ws";
import { Player, PlayerRepository } from "../storage/playerRepository";
import { Messenger } from "../shared/messenger";
import { createMessage, MESSAGE_TYPES } from "../shared/message";

class RegistrationHandler {
  playerRepository: PlayerRepository;
  messenger = new Messenger();

  constructor(playerRepository: PlayerRepository) {
    this.playerRepository = playerRepository;
  }

  updatePlayer(player: Player, ws: WebSocket, clientId: string) {
    player.ws = ws;
    player.clientId = clientId;
  }

  handle(ws: WebSocket, data: any, clientId: string) {
    const { name: userName, password } = JSON.parse(data);
    let player = this.playerRepository.findByName(userName);

    if (!player) {
      this.playerRepository.addPlayer(userName, password, clientId, ws);
      return;
    }

    if (player.password !== password) {
      this.messenger.sendMessage(ws, createMessage({
        type: MESSAGE_TYPES.REGISTRATION,
        data: {
          userName,
          clientId,
          error: true,
          errorText: "Invalid password",
        },
      }));
      return;
    }

    this.updatePlayer(player, ws, clientId);

    this.messenger.sendMessage(ws, createMessage({
      type: MESSAGE_TYPES.REGISTRATION,
      data: {
        userName,
        clientId,
        error: false,
        errorText: "",
      },
    }));
  }
}

export { RegistrationHandler };

import { WebSocket } from "ws";
import { createMessage, IMessage } from "./message";
import { Player, PlayerRepository } from "../storage/playerRepository";
import { Game } from "../storage/gameRepository";

export class Messenger {
  sendMessage(ws: WebSocket, message: IMessage) {
    ws.send(JSON.stringify({ ...message, data: JSON.stringify(message.data) }));
  }

  sendError(ws: WebSocket, errorText: string, clientId: string, userName: string) {
    this.sendMessage(ws, createMessage({type: "error", data: { userName, clientId, error: true, errorText }}));
  }

  sendBroadcastMessage(message: IMessage, players: Player[]) {
    for (const player of players) {
      player.ws?.send(JSON.stringify({ ...message, data: JSON.stringify(message.data) }));
    }
  }

  sendStartGameMessage(game: Game, playerRepository: PlayerRepository) {
    for (const clientId in game.players) {
      const player = playerRepository.findById(clientId);
      if (player) {
        player.ws ? this.sendMessage(player.ws, {
          type: "start_game",
          data: {
            ships: game.players[clientId].ships,
            currentPlayerIndex: clientId,
          },
          id: 0,
        }) : null;
      }
    }
  }

  sendTurnMessage(game: Game, playerRepository: PlayerRepository) {
    this.sendBroadcastMessage({
      type: "turn",
      data: {
        currentPlayer: game.currentTurn,
      },
      id: 0,
    }, this.getPlayers(game, playerRepository));
  }

  sendFinishMessage(game: Game, winnerId: string, playerRepository: PlayerRepository) {
    this.sendBroadcastMessage({
      type: "finish",
      data: {
        winPlayer: winnerId,
      },
      id: 0,
    }, this.getPlayers(game, playerRepository));
  }

  sendUpdateWinners(playerRepository: PlayerRepository) {
    const winnerList = playerRepository.findAll()
      .filter((p) => !p.name.startsWith("_bot_"))
      .sort((a, b) => b.wins - a.wins)
      .map((p) => ({ name: p.name, wins: p.wins }));

    this.sendBroadcastMessage({
      type: "update_winners",
      data: winnerList,
      id: 0,
    }, playerRepository.findAll());
  }

  getPlayers(game: Game, playerRepository: PlayerRepository) {
    const players = [];
    for (const clientId in game.players) {
      const player = playerRepository.findById(clientId);
      if (player) players.push(player);
    }
    return players;
  }
}

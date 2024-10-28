import { WebSocket } from 'ws';
import { Room, RoomRepository } from "../storage/roomRepository";
import { Messenger } from "../shared/messenger";
import { PlayerRepository } from "../storage/playerRepository";
import GameService from "../shared/gameService";

class RoomHandler {
  messenger = new Messenger();
  roomRepository: RoomRepository;
  playerRepository: PlayerRepository;
  gameService: GameService;

  constructor(roomRepository: RoomRepository, playerRepository: PlayerRepository, gameService: GameService) {
    this.roomRepository = roomRepository;
    this.playerRepository = playerRepository;
    this.gameService = gameService;
  }

  createRoom(clientId: string) {
    const room = this.roomRepository.addRoom();
    room.players.push(clientId);
    this.sendUpdateRoom();
  }

  addUserToRoom(ws: WebSocket, data: any, clientId: string) {
    const { indexRoom: roomIndex } = JSON.parse(data);
    const room = this.roomRepository.findRoom(roomIndex);
    if (!room || room.players.length >= 2) {
      this.messenger.sendError(ws, 'Room not available', clientId, '');

      return;
    }

    room.players.push(clientId);
    this.sendUpdateRoom();
    this.startGame(room);
  }

  private startGame(room: Room) {
    room.gameStarted = true;

    const game = this.gameService.createNewGame(room.players);
    console.log("New game created", game);
    const [playerId1, playerId2] = room.players;
    const player1 = this.playerRepository.findById(playerId1);
    const player2 = this.playerRepository.findById(playerId2);

    player1?.ws ? this.messenger.sendMessage(player1.ws, {
      type: 'create_game',
      data: {
        idGame: game.id,
        idPlayer: playerId1,
      },
      id: 0,
    }) : null;

    player2?.ws ? this.messenger.sendMessage(player2.ws, {
      type: 'create_game',
      data: {
        idGame: game.id,
        idPlayer: playerId2,
      },
      id: 0,
    }) : null;
  }

  private sendUpdateRoom() {
    this.messenger.sendBroadcastMessage({
      type: 'update_room',
      data: this.roomRepository.findAll()
        .filter((room) => room.players.length === 1)
        .map((room) => ({
          roomId: room.id,
          roomUsers: room.players.map((clientId) => {
            const player = this.playerRepository.findById(clientId);
            return {
              name: player?.name,
              clientId,
            };
          }),
        })),
      id: 0,
    }, this.playerRepository.findAll());
  }
}

export {RoomHandler};

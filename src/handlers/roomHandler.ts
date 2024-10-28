import { WebSocket } from 'ws';
import { Room, RoomRepository } from "../storage/roomRepository";
import { Messenger } from "../shared/messenger";
import { PlayerRepository } from "../storage/playerRepository";

class RoomHandler {
  messenger = new Messenger();
  roomRepository: RoomRepository;
  playerRepository: PlayerRepository;

  constructor(roomRepository: RoomRepository, playerRepository: PlayerRepository) {
    this.roomRepository = roomRepository;
    this.playerRepository = playerRepository;
  }

  createRoom(clientId: string) {
    const room = this.roomRepository.addRoom();
    room.players.push(clientId);
    this.sendUpdateRoom();
  }

  addUserToRoom(ws: WebSocket, data: any, clientId: string) {
    const { roomIndex } = JSON.parse(data);
    const room = this.roomRepository.findRoom(roomIndex);
    if (!room || room.players.length >= 2) {
      this.messenger.sendError(ws, 'Room not available', clientId, '');

      return;
    }

    room.players.push(clientId);
    this.sendUpdateRoom();
  }

  private sendUpdateRoom() {
    this.messenger.sendBroadcastMessage({
      type: 'update_room',
      data: this.roomRepository.findAll()
        .filter((room) => room.players.length === 1)
        .map((room) => ({
          roomId: room.roomId,
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

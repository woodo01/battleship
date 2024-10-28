class Room {
  roomId: string;
  players: string[];
  gameStarted: boolean;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.players = [];
    this.gameStarted = false;
  }
}

class RoomRepository {
  rooms = new Map<string, Room>();

  getLastRoomId(): number {
    return this.rooms.size > 0 ? Math.max(...Array.from(this.rooms.keys()).map((roomId) => parseInt(roomId))) : -1;
  }

  findRoom(roomIndex: string): Room|undefined {
    return this.rooms.get(roomIndex);
  }

  addRoom(): Room {
    const room = new Room((this.getLastRoomId() + 1).toString());
    this.rooms.set(room.roomId, room);
    return room;
  }

  findAll() {
    return Array.from(this.rooms.values());
  }
}

export { Room, RoomRepository };

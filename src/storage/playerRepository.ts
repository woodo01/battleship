import { WebSocket } from 'ws';

class Player {
  name: string;
  password: string;
  wins: number;
  clientId: string;
  ws: WebSocket | null;

  constructor(name: string, password: string, clientId: string, ws: WebSocket | null) {
    this.name = name;
    this.password = password;
    this.wins = 0;
    this.clientId = clientId;
    this.ws = ws;
  }
}

class PlayerRepository {
  players = new Map<string, Player>();

  findByName(playerName: string): Player|undefined {
    return Array.from(this.players.values()).find((player) => player.name === playerName);
  }

  addPlayer(userName: any, password: any, clientId: string, ws: WebSocket) {
    this.players.set(clientId, new Player(userName, password, clientId, ws));
  }

  findAll() {
    return this.players;
  }
}

export { Player, PlayerRepository };

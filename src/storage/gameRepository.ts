export interface ShipInfo {
  position: { x: number; y: number };
  direction: boolean;
  length: 1 | 2 | 3 | 4;
  type: "small" | "medium" | "large" | "huge";
}

export interface PlayerInfo {
  ships: ShipInfo[];
  shotsReceived: { x: number; y: number }[];
}

class Game {
  id: string;
  players: { [clientId: string]: PlayerInfo };
  currentTurn: string;

  constructor(id: string, playerIds: string[]) {
    this.id = id;
    this.players = {};
    for (const id of playerIds) {
      this.players[id] = {
        ships: [],
        shotsReceived: [],
      };
    }
    this.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
  }
}

class GameRepository {
  games = new Map<string, Game>();

  getLastGameId(): number {
    return this.games.size > 0 ? Math.max(...Array.from(this.games.keys()).map((gameId) => parseInt(gameId))) : -1;
  }

  findGame(gameIndex: string): Game|undefined {
    return this.games.get(gameIndex);
  }

  addGame(players: string[]): Game {
    const game = new Game((this.getLastGameId() + 1).toString(), players);
    this.games.set(game.id, game);
    return game;
  }

  findAll() {
    return Array.from(this.games.values());
  }
}

export { Game, GameRepository };

import { WebSocket } from "ws";
import { Game, GameRepository } from "../storage/gameRepository";
import { Messenger } from "../shared/messenger";
import { Player, PlayerRepository } from "../storage/playerRepository";
import ShipService from "../shared/shipService";

class GameHandler {
  timers = new Map<string, NodeJS.Timeout>();

  shipService = new ShipService();
  messenger = new Messenger();
  gameRepository: GameRepository;
  playerRepository: PlayerRepository;

  constructor(gameRepository: GameRepository, playerRepository: PlayerRepository) {
    this.gameRepository = gameRepository;
    this.playerRepository = playerRepository;
  }

  handleAddShips(ws: WebSocket, data: any) {
    const { gameId, ships, indexPlayer } = JSON.parse(data);
    const game = this.gameRepository.findGame(gameId);

    if (!game || !game.players[indexPlayer]) {
      this.messenger.sendError(ws, `Undefined game or player`, '', '')
      return;
    }
    game.players[indexPlayer].ships = ships;

    const allPlayersReady = Object.values(game.players).every((p) => p.ships.length > 0);
    if (!allPlayersReady) {
      this.messenger.sendError(ws, `Waiting for player ships ${game.players}`, '', '')
      return;
    }
    this.messenger.sendStartGameMessage(game, this.playerRepository);
    this.messenger.sendTurnMessage(game, this.playerRepository);
    this.setTurnTimer(game);
  }

  setTurnTimer(game: Game) {
    if (this.timers.has(game.id)) {
      clearTimeout(this.timers.get(game.id)!);
    }

    const timer = setTimeout(() => this.performRandomAttack(game), 10_000);
    this.timers.set(game.id, timer);
  }

  performRandomAttack(game: Game) {
    const playerId = game.currentTurn;
    const ws = this.playerRepository.findById(playerId)?.ws;
    if (!ws) return;

    let x = 0;
    let y = 0;
    let validAttack = false;

    while (!validAttack) {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);

      const opponentId = Object.keys(game.players).find((id) => id !== playerId)!;
      const opponentData = game.players[opponentId];

      validAttack = !opponentData.shotsReceived.some((shot) => shot.x === x && shot.y === y);
    }

    this.handleAttack(
      ws,
      JSON.stringify({ gameId: game.id, x, y, indexPlayer: playerId })
    );
  }

  handleAttack(ws: WebSocket, data: any) {
    const { gameId, x, y, indexPlayer } = JSON.parse(data);
    const game = this.gameRepository.findGame(gameId);

    if (!game || game.currentTurn !== indexPlayer) {
      console.log("Invalid turn or game not found");
      return;
    }

    clearTimeout(this.timers.get(gameId)!);
    this.timers.delete(gameId);

    const players: Player[] = [];
    for (const clientId in game.players) {
      const player = this.playerRepository.findById(clientId);
      if (player) players.push(player);
    }

    const opponentId = Object.keys(game.players).find(
      (id) => id !== indexPlayer
    )!;
    const opponentData = game.players[opponentId];

    const hitShip = opponentData.ships.find((ship) => {
      return this.shipService.shipContainsCoordinate(ship, x, y);
    });

    let status: "miss" | "shot" | "killed" = "miss";
    if (hitShip) {
      if (
        !opponentData.shotsReceived.some((shot) => shot.x === x && shot.y === y)
      ) {
        opponentData.shotsReceived.push({ x, y });
      }
      const isKilled = this.shipService.isShipSunk(hitShip, opponentData.shotsReceived);
      status = isKilled ? "killed" : "shot";

      if (isKilled) {
        const surroundingCells = this.shipService.findSurroundingCellsForShip(hitShip);
        surroundingCells.forEach((cell) => {
          if (
            cell.x >= 0 &&
            cell.y >= 0 &&
            !opponentData.shotsReceived.some(
              (shot) => shot.x === cell.x && shot.y === cell.y
            ) &&
            !opponentData.ships.some((ship) =>
              this.shipService.shipContainsCoordinate(ship, cell.x, cell.y)
            )
          ) {
            opponentData.shotsReceived.push(cell);
            this.messenger.sendBroadcastMessage({
              type: "attack",
              data: {
                position: { x: cell.x, y: cell.y },
                currentPlayer: indexPlayer,
                status: "miss",
              },
              id: 0,
            }, players);
          }
        });
      }

      if (this.shipService.isPlayerDefeated(opponentData)) {
        this.messenger.sendFinishMessage(game, indexPlayer, this.playerRepository);
        const player = this.playerRepository.findById(indexPlayer);
        if (player) {
          player.wins += 1;
          this.messenger.sendUpdateWinners(this.playerRepository);
        }
        return;
      }
    }

    this.messenger.sendBroadcastMessage({
      type: "attack",
      data: {
        position: { x, y },
        currentPlayer: indexPlayer,
        status,
      },
      id: 0,
    }, players);

    if (status === "miss") {
      game.currentTurn = opponentId;
    }
    this.messenger.sendTurnMessage(game, this.playerRepository);
  }
}

export default GameHandler;

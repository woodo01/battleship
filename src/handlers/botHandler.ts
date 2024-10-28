import { WebSocket } from 'ws';
import { Messenger } from "../shared/messenger";
import { Player, PlayerRepository } from "../storage/playerRepository";
import { Game, PlayerInfo, ShipInfo } from "../storage/gameRepository";
import { Room, RoomRepository } from "../storage/roomRepository";
import GameService from "../shared/gameService";
import ShipService from "../shared/shipService";

class BotHandler {
  botIdCounter = 0;
  messenger = new Messenger();
  shipService = new ShipService();
  roomRepository: RoomRepository;
  playerRepository: PlayerRepository;
  gameService: GameService;

  constructor(roomRepository: RoomRepository, playerRepository: PlayerRepository, gameService: GameService) {
    this.playerRepository = playerRepository;
    this.roomRepository = roomRepository;
    this.gameService = gameService;
  }

  handleSinglePlay(ws: WebSocket, clientId: string) {
    const humanPlayer = this.playerRepository.findById(clientId);
    if (!humanPlayer) {
      this.messenger.sendError(ws, 'Player not registered', clientId, '');
      return;
    }

    const botClientId = `bot-${this.botIdCounter++}`;
    const botPlayer = this.playerRepository.addPlayer('Bot', '', botClientId, null);

    const room = this.roomRepository.addRoom();
    this.startGameWithBot(room, humanPlayer, botPlayer);
  }

  startGameWithBot(room: Room, humanPlayer: Player, botPlayer: Player) {
    const game = this.gameService.createNewGame([humanPlayer.clientId, botPlayer.clientId]);
    this.messenger.sendMessage(humanPlayer.ws!, {
      type: 'create_game',
      data: {
        idGame: game.id,
        idPlayer: humanPlayer.clientId,
      },
      id: 0,
    });
    this.autoPlaceShips(game, botPlayer.clientId);
    game.currentTurn = Math.random() < 0.5 ? humanPlayer.clientId : botPlayer.clientId;
  }

  autoPlaceShips(game: Game, clientId: string) {
    game.players[clientId].ships = this.generateRandomShips();
  }

  generateRandomShips(): ShipInfo[] {
    const ships: ShipInfo[] = [];

    const shipDefinitions: {
      type: "small" | "medium" | "large" | "huge";
      length: 1 | 2 | 3 | 4;
    }[] = [
      { type: 'huge', length: 4 },
      ...[].concat(...Array(2).fill({ type: 'large', length: 3 })),
      ...[].concat(...Array(3).fill({ type: 'medium', length: 2 })),
      ...[].concat(...Array(4).fill({ type: 'small', length: 1 })),
    ];

    for (const shipDef of shipDefinitions) {
      let placed = false;
      while (!placed) {
        const direction = Math.random() < 0.5;
        const maxPosition = 10 - shipDef.length;
        const x = Math.floor(Math.random() * (direction ? 10 : maxPosition));
        const y = Math.floor(Math.random() * (direction ? maxPosition : 10));

        const newShip: ShipInfo = {
          position: { x, y },
          direction,
          length: shipDef.length,
          type: shipDef.type,
        };

        if (!this.isOverlap(ships, newShip)) {
          ships.push(newShip);
          placed = true;
        }
      }
    }
    return ships;
  }

  isOverlap(existingShips: ShipInfo[], newShip: ShipInfo): boolean {
    for (const ship of existingShips) {
      if (this.doShipsOverlap(ship, newShip)) {
        return true;
      }
    }
    return false;
  }

  doShipsOverlap(ship1: ShipInfo, ship2: ShipInfo): boolean {
    const ship1Cells = this.shipService.findShipCells(ship1);
    const ship2Cells = this.shipService.findShipCells(ship2);

    for (const cell1 of ship1Cells) {
      for (const cell2 of ship2Cells) {
        if (cell1.x === cell2.x && cell1.y === cell2.y) {
          return true;
        }
        if (Math.abs(cell1.x - cell2.x) <= 1 && Math.abs(cell1.y - cell2.y) <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  botMakeMove(game: Game, botClientId: string) {
    const opponentId = Object.keys(game.players).find((id) => id !== botClientId)!;
    const opponentData = game.players[opponentId];
    const { x, y } = this.generateCoordinatesForAttack(opponentData);
    const result = this.processAttack(game, botClientId, x, y);

    const humanPlayer = this.playerRepository.findById(opponentId);
    if (humanPlayer && humanPlayer.ws) {
      this.messenger.sendMessage(humanPlayer.ws, {
        type: 'attack',
        data: {
          position: { x, y },
          currentPlayer: botClientId,
          status: result.status,
        },
        id: 0,
      });
    }

    if (result.gameOver) {
      this.sendFinishMessage(game, botClientId);
      const player = this.playerRepository.findById(botClientId);
      if (player) {
        player.wins += 1;
        this.messenger.sendUpdateWinners(this.playerRepository);
      }
      return;
    } else if (result.status === 'miss') {
      game.currentTurn = opponentId;
    } else {
      game.currentTurn = botClientId;
    }

    this.messenger.sendTurnMessage(game, this.playerRepository);
    setTimeout(() => this.botMakeMove(game, game.currentTurn), 1000);
  }

  generateCoordinatesForAttack(data: PlayerInfo): { x: number; y: number } {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);
    } while (data.shotsReceived.some((shot) => shot.x === x && shot.y === y));
    return { x, y };
  }

  processAttack(game: Game, attackerId: string, x: number, y: number): { status: 'miss' | 'shot' | 'killed'; gameOver: boolean } {
    const opponentId = Object.keys(game.players).find((id) => id !== attackerId)!;
    const opponentData = game.players[opponentId];

    const hitShip = opponentData.ships.find((ship) => {
      return this.shipService.shipContainsCoordinate(ship, x, y);
    });

    let status: 'miss' | 'shot' | 'killed' = 'miss';
    if (hitShip) {
      if (!opponentData.shotsReceived.some((shot) => shot.x === x && shot.y === y)) {
        opponentData.shotsReceived.push({ x, y });
      }

      const isKilled = this.shipService.isShipSunk(hitShip, opponentData.shotsReceived);
      status = isKilled ? 'killed' : 'shot';

      if (isKilled) {
        const surroundingCells = this.shipService.findSurroundingCellsForShip(hitShip);

        for (const cell of surroundingCells) {
          if (
            !opponentData.shotsReceived.some(
              (shot) => shot.x === cell.x && shot.y === cell.y
            ) &&
            !opponentData.ships.some((ship) =>
              this.shipService.shipContainsCoordinate(ship, cell.x, cell.y)
            )
          ) {
            opponentData.shotsReceived.push(cell);
            const humanPlayer = this.playerRepository.findById(opponentId);
            if (humanPlayer && humanPlayer.ws) {
              this.messenger.sendMessage(humanPlayer.ws, {
                type: 'attack',
                data: {
                  position: cell,
                  currentPlayer: attackerId,
                  status: 'miss',
                },
                id: 0,
              });
            }
          }
        }
      }
    }
    const gameOver = this.shipService.isPlayerDefeated(opponentData);

    return { status, gameOver };
  }

  sendFinishMessage(game: Game, winnerId: string) {
    const humanPlayerId = Object.keys(game.players).find((id) => !id.startsWith('bot'));
    const humanPlayer = this.playerRepository.findById(humanPlayerId!);
    if (humanPlayer && humanPlayer.ws) {
      this.messenger.sendMessage(humanPlayer.ws, {
        type: 'finish',
        data: {
          winPlayer: winnerId,
        },
        id: 0,
      });
    }
  }
}

export {BotHandler};


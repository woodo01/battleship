import { Game, GameRepository } from "../storage/gameRepository";

class GameService {
  gameRepository: GameRepository;

  constructor(gameRepository: GameRepository) {
    this.gameRepository = gameRepository;
  }

  createNewGame(playerIds: string[]): Game {
    return this.gameRepository.addGame(playerIds)
  }
}

export default GameService;

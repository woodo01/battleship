import { ShipInfo } from "../storage/gameRepository";

class ShipService {

  isPlayerDefeated(playerData: any): boolean {
    for (const ship of playerData.ships) {
      if (!this.isShipSunk(ship, playerData.shotsReceived)) {
        return false;
      }
    }
    return true;
  }

  isShipSunk(
    ship: ShipInfo,
    shotsReceived: { x: number; y: number }[]
  ): boolean {
    const shipCells = this.findShipCells(ship);
    return shipCells.every((cell) =>
      shotsReceived.some((shot) => shot.x === cell.x && shot.y === cell.y)
    );
  }

  findShipCells(ship: ShipInfo): { x: number; y: number }[] {
    const cells = [];
    for (let i = 0; i < ship.length; i++) {
      const x = ship.direction ? ship.position.x : ship.position.x + i;
      const y = ship.direction ? ship.position.y + i : ship.position.y;
      cells.push({ x, y });
    }
    return cells;
  }

  shipContainsCoordinate(
    ship: ShipInfo,
    x: number,
    y: number
  ): boolean {
    const cells = this.findShipCells(ship);
    return cells.some((cell) => cell.x === x && cell.y === y);
  }

  findSurroundingCellsForShip(ship: ShipInfo) {
    const surroundingCells = [];
    for (const coordinate of this.findShipCells(ship)) {
      surroundingCells.push(...this.getSurroundingCells(coordinate.x, coordinate.y));
    }
    return surroundingCells;
  }

  getSurroundingCells(x: number, y: number) {
    return [
      { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
      { x: x - 1, y: y }, { x: x + 1, y: y },
      { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
    ];
  }
}

export default ShipService;

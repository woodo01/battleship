enum MESSAGE_TYPES {
  REGISTRATION = 'reg',
  SINGLE_PLAY = 'single_play',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  ADD_SHIPS = 'add_ships',
  ATTACK = 'attack',
}

export { MESSAGE_TYPES};

export interface IMessage {
  type: string;
  data: string;
  id: number;
}

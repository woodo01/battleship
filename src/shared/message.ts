enum MESSAGE_TYPES {
  REGISTRATION = 'reg',
  SINGLE_PLAY = 'single_play',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  ADD_SHIPS = 'add_ships',
  ATTACK = 'attack',
}

export { MESSAGE_TYPES};

export interface IUserData {
  userName: string,
  clientId: string,
  error: boolean,
  errorText: string,
}

export interface IUserData {
  userName: string,
  clientId: string,
  error: boolean,
  errorText: string,
}

export interface IRoomData {
  roomId: string,
  roomUsers: {
    name: string|undefined,
    clientId: string,
  }[]
}

export interface IMessage {
  type: string;
  data: IUserData | IRoomData[];
  id: number;
}

export const createMessageData = (overrides: Partial<IUserData>|Partial<IRoomData[]> = {}): IUserData => {
  return {
    userName: 'Guest',
    clientId: '',
    error: false,
    errorText: '',
    ...overrides,
  };
};

export const createMessage = (overrides: Partial<IMessage> = {}): IMessage => {
  return {
    type: 'defaultType',
    data: createMessageData(overrides.data),
    id: 0,
    ...overrides,
  };
};

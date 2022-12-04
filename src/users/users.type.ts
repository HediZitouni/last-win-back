import { Document, ObjectId, WithId } from "mongodb";
import { Game } from "~/game/game.type";

export interface UserMongodb extends WithId<Document> {
  _id: ObjectId;
  deviceId: ObjectId;
  name: string;
  games: Game[] | ObjectId[];
}

export interface User extends UserSafe {
  id: string;
  deviceId: string;
  isLast?: boolean;
  games: Game[] | ObjectId[];
}

export interface UserSafe {
  name: string;
}

export function toUser(userMongodb: UserMongodb): User {
  const { _id, deviceId, games: gamesToConvert, ...properties } = userMongodb;
  const games = gamesToConvert?.map((game) => {
    if ("_id" in game) {
      return { ...game, id: game._id.toString() };
    }
    return game.toString();
  });
  return { id: _id.toString(), deviceId: deviceId.toString(), games, ...properties } as User;
}

export function toUserArray(usersMongodb: UserMongodb[]): User[] {
  return usersMongodb.map((user) => toUser(user));
}

export function toUserSafe(userMongodb: User): UserSafe {
  const { id, deviceId, ...properties } = userMongodb;
  return { ...properties } as UserSafe;
}

export function toUserSafeArray(usersMongodb: User[]): UserSafe[] {
  return usersMongodb.map((user) => toUserSafe(user));
}

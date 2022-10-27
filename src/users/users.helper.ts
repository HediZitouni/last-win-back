import { UserInGame } from "~/game/game.type";
import { Last } from "~/last/last.type";
import { User } from "./users.type";

export function enhanceUser(user: User, last: Last) {
  if (user.id === last.idUser) {
    user.score += Math.round(Date.now() / 1000) - last.date;
    user.isLast = true;
  }
}

export function enhanceUsers(users: User[], last: Last) {
  users.forEach((user) => enhanceUser(user, last));
}

export function getUserInUsers(idUser: string, users?: UserInGame[]): UserInGame {
  if (!users) throw new Error("There are no users");
  const user = users.find((user) => user.idUser === idUser);
  if (!user) throw new Error("User is not in the game");
  return user;
}

import { Game, UserInGame } from "~/game/game.type";
import { User } from "./users.type";

export function enhanceUser(user: User, game: Game) {
  if (!game.users) return;
  const indexUser = game.users.findIndex(({ idUser }) => idUser === user.id);
  if (indexUser !== -1) {
    game.users[indexUser].score += Math.round(Date.now() / 1000) - game.last.date;
  }
}

export function getUserInUsers(idUser: string, users?: UserInGame[]): UserInGame {
  if (!users) throw new Error("There are no users");
  const user = users.find((user) => user.idUser === idUser);
  if (!user) throw new Error("User is not in the game");
  return user;
}

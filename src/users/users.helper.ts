import { Game, UserInGame } from "~/game/game.type";

export function enhanceUser(game: Game) {
  if (!game.users) return;
  const indexUser = game.users.findIndex(({ idUser }) => idUser === game.last.idUser);
  if (indexUser !== -1) {
    const dateNow = Math.round(Date.now() / 1000);
    game.users[indexUser].score += Math.min(dateNow, game.endedAt || Infinity) - game.last.date;
  }
}

export function getUserInUsers(idUser: string, users?: UserInGame[]): UserInGame {
  if (!users) throw new Error("There are no users");
  const user = users.find((user) => user.idUser === idUser);
  if (!user) throw new Error("User is not in the game");
  return user;
}

import 'dotenv/config';
import express from 'express';
import { getUsers, getUsersByIds, setUserScore, getOrCreateUser, setUserName, getUserById } from './users/users.lib';
import cors from 'cors';
import { getLast, getOrCreateLast, updateLast } from './last/last.lib';
import { logCalls } from './middlewares/log-calls.middleware';
import { initDatabase } from './config/mongodb';
import { initRestatCreditJob } from './credit/credit.job';
import { decreaseUserCredit } from './credit/credit.lib';
import { toUserSafeArray } from './users/users.type';
import { enhanceUser, enhanceUsers } from './users/users.helper';
import { getGames, createGame, getGameById, joinGame, startGame } from './games/games.lib';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
	origin: process.env.CORS_ORIGIN || 'https://otrom.fr',
}));
app.use(express.json());
app.use(logCalls);

app.get('/lastwin/api', async (req, res) => {
	res.send('Hello world!');
});

// Games

app.get('/lastwin/api/games', async (req, res) => {
	try {
		const games = await getGames();
		res.send(games);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.get('/lastwin/api/games/:id', async (req, res) => {
	try {
		const game = await getGameById(req.params.id);
		if (!game) return res.status(404).send('Game not found');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.post('/lastwin/api/games', async (req, res) => {
	try {
		const { name, createdBy } = req.body;
		if (!name) return res.status(400).send('Missing game name');
		if (!createdBy) return res.status(400).send('Missing createdBy');
		const game = await createGame(name, createdBy);
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.put('/lastwin/api/games/:id/join', async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		const game = await joinGame(req.params.id, userId);
		if (!game) return res.status(400).send('Cannot join: game not found or not a player of this game');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.put('/lastwin/api/games/:id/start', async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		const game = await startGame(req.params.id, userId);
		if (!game) return res.status(403).send('Cannot start: not the creator or game already started');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

// Users

app.get('/lastwin/api/user', async (req, res) => {
	try {
		const id = req.query.id as string;
		const gameId = req.query.gameId as string;
		if (!id || id === 'undefined') return res.status(400).send('Missing user id');
		const user = await getUserById(id);
		if (!user) return res.status(404).send('User not found');
		if (gameId) {
			const last = await getLast(gameId);
			if (last) {
				enhanceUser(user, last);
			}
		}
		res.send(user);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.get('/lastwin/api/users', async (req, res) => {
	try {
		const gameId = req.query.gameId as string;
		let users;
		if (gameId) {
			const game = await getGameById(gameId);
			if (!game) return res.status(404).send('Game not found');
			users = await getUsersByIds(game.players || []);
			const last = await getLast(gameId);
			if (last) {
				enhanceUsers(users, last);
			}
		} else {
			users = await getUsers();
		}
		res.send(toUserSafeArray(users));
	} catch (e) {
		res.send(e);
	}
});

app.put('/lastwin/api/last', async (req, res) => {
	try {
		const { id, gameId } = req.body;
		if (!gameId) return res.status(400).send('Missing gameId');
		const game = await getGameById(gameId);
		if (!game) return res.status(404).send('Game not found');
		if (game.status !== 'started') return res.status(400).send('Game not started');
		if (!game.players.includes(id)) return res.status(403).send('Not a player of this game');
		const newDateLast = Math.round(Date.now() / 1000);
		const user = await getUserById(id);
		if (!user) return res.status(404).send('User not found');
		if (user.credit < 1) return res.send('User has no credit');

		const last = await getOrCreateLast(gameId, id);
		if (last.idLastUser !== id) {
			await setUserScore(last, newDateLast);
			await decreaseUserCredit(id);
			await updateLast(gameId, id, newDateLast);
		}
		res.send('Update done!');
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.post('/lastwin/api/users', async (req, res) => {
	try {
		const { deviceId } = req.body;
		const user = await getOrCreateUser(deviceId);
		res.send(user);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.put('/lastwin/api/users', async (req, res) => {
	try {
		const { id, name } = req.body;
		await setUserName(id, name);
		const user = await getUserById(id);
		res.send(user);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.listen(port, async () => {
	console.log(`Example app listening on port ${port}`);
	await initDatabase();
	await initRestatCreditJob();
});

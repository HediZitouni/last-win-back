import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getOrCreateUser } from './users/users.lib';
import cors from 'cors';
import { getLast, getOrCreateLast, updateLast } from './last/last.lib';
import { logCalls } from './middlewares/log-calls.middleware';
import { initDatabase } from './config/mongodb';
import { initRestatCreditJob } from './credit/credit.job';
import {
	getGamesByPlayer, createGame, getGameById, joinGameByCode,
	rejoinGame, startGame, updatePlayerName, getPlayerFromGame,
	enhancePlayersWithLast, addPlayerScore, decreasePlayerCredit,
	updateGameSettings,
} from './games/games.lib';

const app = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || 'https://otrom.fr';
const port = process.env.PORT || 3000;

const io = new Server(httpServer, {
	cors: { origin: corsOrigin },
});

io.on('connection', (socket) => {
	socket.on('join-game', (gameId: string) => {
		socket.join(gameId);
	});
});

app.use(cors({
	origin: corsOrigin,
}));
app.use(express.json());
app.use(logCalls);

app.get('/lastwin/api', async (req, res) => {
	res.send('Hello world!');
});

// Games

app.get('/lastwin/api/games', async (req, res) => {
	try {
		const userId = req.query.userId as string;
		if (!userId) return res.status(400).send('Missing userId');
		const games = await getGamesByPlayer(userId);
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

app.put('/lastwin/api/games/join', async (req, res) => {
	try {
		const { code, userId } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		if (!code) return res.status(400).send('Missing code');
		const game = await joinGameByCode(code, userId);
		if (!game) return res.status(400).send('Code invalide ou partie déjà lancée');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.put('/lastwin/api/games/:id/rejoin', async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		const game = await rejoinGame(req.params.id, userId);
		if (!game) return res.status(400).send('Partie introuvable ou vous n\'en faites pas partie');
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

app.put('/lastwin/api/games/:id/player/name', async (req, res) => {
	try {
		const { userId, name } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		if (!name) return res.status(400).send('Missing name');
		const game = await updatePlayerName(req.params.id, userId, name);
		if (!game) return res.status(404).send('Game not found');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.put('/lastwin/api/games/:id/settings', async (req, res) => {
	try {
		const { userId, settings } = req.body;
		if (!userId) return res.status(400).send('Missing userId');
		if (!settings) return res.status(400).send('Missing settings');
		const game = await updateGameSettings(req.params.id, userId, settings);
		if (!game) return res.status(403).send('Cannot update: not the creator or game already started');
		res.send(game);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

// Players (game-scoped)

app.get('/lastwin/api/games/:id/players', async (req, res) => {
	try {
		const game = await getGameById(req.params.id);
		if (!game) return res.status(404).send('Game not found');
		const last = await getLast(game.id);
		const players = enhancePlayersWithLast(game.players, last);
		res.send(players);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.get('/lastwin/api/games/:id/player', async (req, res) => {
	try {
		const userId = req.query.userId as string;
		if (!userId) return res.status(400).send('Missing userId');
		const game = await getGameById(req.params.id);
		if (!game) return res.status(404).send('Game not found');
		const last = await getLast(game.id);
		const players = enhancePlayersWithLast(game.players, last);
		const player = players.find((p) => p.userId === userId);
		if (!player) return res.status(404).send('Player not found in game');
		res.send(player);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

// Last

app.put('/lastwin/api/last', async (req, res) => {
	try {
		const { userId, gameId } = req.body;
		if (!gameId) return res.status(400).send('Missing gameId');
		if (!userId) return res.status(400).send('Missing userId');
		const game = await getGameById(gameId);
		if (!game) return res.status(404).send('Game not found');
		if (game.status !== 'started') return res.status(400).send('Game not started');
		if (game.settings.timeLimitSeconds && game.startedAt) {
			const now = Math.round(Date.now() / 1000);
			if (now - game.startedAt > game.settings.timeLimitSeconds) {
				return res.status(400).send('Partie terminée (temps écoulé)');
			}
		}
		const player = getPlayerFromGame(game, userId);
		if (!player) return res.status(403).send('Not a player of this game');
		if (player.credit < 1) return res.status(400).send('No credit left');

		const newDateLast = Math.round(Date.now() / 1000);
		const last = await getOrCreateLast(gameId, userId);
		if (last.idLastUser !== userId) {
			const scoreToAdd = newDateLast - last.date;
			await addPlayerScore(gameId, last.idLastUser, scoreToAdd);
			await decreasePlayerCredit(gameId, userId);
			await updateLast(gameId, userId, newDateLast);
		}

		const updatedGame = await getGameById(gameId);
		if (updatedGame) {
			const updatedLast = await getLast(gameId);
			const enhancedPlayers = enhancePlayersWithLast(updatedGame.players, updatedLast);
			io.to(gameId).emit('last-updated', enhancedPlayers);
		}

		res.send('Update done!');
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

// Users (device registration only)

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

httpServer.listen(port, async () => {
	console.log(`Example app listening on port ${port}`);
	await initDatabase();
	await initRestatCreditJob();
});

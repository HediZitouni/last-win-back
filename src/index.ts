import 'dotenv/config';
import express from 'express';
import { getUsers, setUserScore, getOrCreateUser, setUserName, getUserById } from './users/users.lib';
import cors from 'cors';
import { getLast, getOrCreateLast, updateLast } from './last/last.lib';
import { logCalls } from './middlewares/log-calls.middleware';
import { initDatabase } from './config/mongodb';
import { initRestatCreditJob } from './credit/credit.job';
import { decreaseUserCredit } from './credit/credit.lib';
import { toUserSafeArray } from './users/users.type';
import { enhanceUser, enhanceUsers } from './users/users.helper';

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

app.get('/lastwin/api/user', async (req, res) => {
	try {
		const id = req.query.id as string;
		const user = await getUserById(id);
		const last = await getLast();
		enhanceUser(user, last);
		res.send(user);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.get('/lastwin/api/users', async (req, res) => {
	try {
		const users = await getUsers();
		const last = await getLast();
		if (last) {
			enhanceUsers(users, last);
		}
		res.send(toUserSafeArray(users));
	} catch (e) {
		res.send(e);
	}
});

app.put('/lastwin/api/last', async (req, res) => {
	try {
		const { id } = req.body;
		const newDateLast = Math.round(Date.now() / 1000);
		const user = await getUserById(id);
		if (user.credit < 1) return res.send('User has no credit');

		const last = await getOrCreateLast(id);
		if (last.idLastUser !== id) {
			await setUserScore(last, newDateLast);
			await decreaseUserCredit(id);
			await updateLast(id, newDateLast);
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

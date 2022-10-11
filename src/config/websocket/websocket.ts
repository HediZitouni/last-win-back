// setupWebSocket.js
import WebSocket from 'ws';
import http from 'http';
import { WebSocketMessage } from './websocket.types';
const clients = new Map();
const clientsToIds = new Map();

// accepts an http server (covered later)
export function setupWebSocket(server: http.Server) {
	// ws instance
	const wss = new WebSocket.Server({ server });

	wss.on('connection', (ws: WebSocket) => {
		console.log('Client connected');
		ws.on('message', (wsm: string) => {
			const { message, content }: WebSocketMessage = JSON.parse(wsm.toString());
			switch (message) {
				case 'setupUser':
					clients.set(content.idUser, ws);
					clientsToIds.set(ws, content.idUser);
					console.log(`${content.idUser} added to ws clients`);
					break;
				default:
					console.log(`${message} is not a known event`);
					break;
			}
		});

		ws.on('close', () => {
			const idClient = clientsToIds.get(ws);
			clients.delete(idClient);
			clientsToIds.delete(ws);
			console.log(`${idClient} deleted`);
		});

		//send immediatly a feedback to the incoming connection
		ws.send(JSON.stringify({ message: 'welcome', content: 'Websocket connection established successfully' }));
	});
}

export function getWsById(idWebSockets: string[]): WebSocket[] {
	const websockets: WebSocket[] = [];
	idWebSockets.forEach((id) => {
		if (clients.has(id)) websockets.push(clients.get(id));
	});
	return websockets;
}

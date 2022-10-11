export interface WebSocketMessage {
	message: string;
	content: SetupUserContent;
}

interface SetupUserContent {
	idUser: string;
}

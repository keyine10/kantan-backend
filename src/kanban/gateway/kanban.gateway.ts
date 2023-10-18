import {
	Inject,
	OnModuleInit,
	UnauthorizedException,
	UseGuards,
	forwardRef,
} from '@nestjs/common';
import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { AuthenticationService } from '../../auth/authentication/authentication.service';
import { BoardsService } from '../boards/boards.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from '../boards/entities/board.entity';
import { Repository } from 'typeorm';
@WebSocketGateway(80)
export class KanbanGateWay implements OnModuleInit {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly authenticationService: AuthenticationService,
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
	) {}
	onModuleInit() {
		this.server.on('connection', async (socket) => {
			const token = socket.handshake.headers.authorization?.split(' ')[1];
			if (!token) {
				this.server.to(socket.id).emit('error', 'Unauthorized');
				socket.disconnect();
			}
			console.log(token);
			socket.join(socket.id);
			try {
				const res = await this.authenticationService.verifyToken(token);
				console.log(res);
				this.server.to(socket.id).emit('message', 'hello ' + res.name);
			} catch (e) {
				console.log(e);
				this.server.to(socket.id).emit('error', 'Unauthorized');
				socket.disconnect();
			}
		});
	}

	@SubscribeMessage('message')
	onNewMessage(@MessageBody() body: any) {
		this.server.emit('message', {
			message: 'Message received',
			content: body,
		});
	}
	@SubscribeMessage('join-room')
	async onJoinRoom(client: Socket, data) {
		console.log(data);
		client.join(data.id);
		let board = await this.boardRepository.findOneBy({ id: data.id });
		// TODO: check if user is a member
		this.server.to(data.id).emit('message', 'hello room ' + board.title);
		// this.server.on('connection', (socket) => {
		//     socket.join(body.id);
		//     this.server.to(body.id).emit('message', 'hello');
		// })
	}
}

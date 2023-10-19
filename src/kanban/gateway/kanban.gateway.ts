import { OnModuleInit } from '@nestjs/common';
import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { AuthenticationService } from '../../auth/authentication/authentication.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from '../boards/entities/board.entity';
import { Repository } from 'typeorm';
@WebSocketGateway(80)
export class KanbanGateWay implements OnModuleInit, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly authenticationService: AuthenticationService,
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
	) {}
	onModuleInit() {
		this.server.on('connection', async (socket: Socket & any) => {
			const token = socket.handshake.headers.authorization?.split(' ')[1];
			if (!token) {
				this.server.to(socket.id).emit('error', 'Unauthorized');
				socket.disconnect();
			}
			socket.join(socket.id);
			try {
				const res = await this.authenticationService.verifyToken(token);
				this.server
					.to(socket.id)
					.emit('message', 'hello ' + res.name + ' ' + res.id);
				//join each user's room with userid
				socket.join(`${res.id}`);
				socket.user = res;
			} catch (e) {
				this.server.to(socket.id).emit('error', e);
				socket.disconnect();
			}
			socket.on('disconnecting', () => {
				console.log('Client disconnecting:', socket.id);
				console.log('client disconnecting from rooms:', socket.rooms);
				socket.rooms.forEach((room) => {
					this.server
						.to(room)
						.except(`${socket.user.id}`)
						.emit('onUserLeave', {
							id: socket.user.id,
							email: socket.user.email,
							name: socket.user.name,
						});
				});
			});
		});
	}
	handleDisconnect(client: Socket) {
		// console.log('Client disconnected:', client.id);
		// console.log(client.rooms);
		// client.disconnect();
	}

	@SubscribeMessage('message')
	onNewMessage(@MessageBody() body: any) {
		this.server.emit('message', {
			message: 'Message received',
			content: body,
		});
	}
	@SubscribeMessage('join-room')
	async onJoinRoom(client: Socket & { user: any }, data) {
		console.log(data);
		client.join(data.id);
		try {
			let board = await this.boardRepository.findOne({
				// user must be a member
				where: [{ id: data.id }],
				relations: ['members'],
			});
			if (!board) {
				this.server.to(client.id).emit('error', 'Board does not exist');
				return;
			}
			//TODO: disallow if not member
			if (!board.members.find((member) => member.id === client.user.id)) {
				this.server
					.to(client.id)
					.emit('error', 'You are not a member of this board');
			}
			//private message to user
			this.server
				.to(client.id)
				.emit('message', 'welcome to room ' + board.title);

			//notify other users in room whenever a user join
			client.broadcast.to(board.id).emit('onUserJoin', {
				id: client.user.id,
				email: client.user.email,
				name: client.user.name,
			});
		} catch (e) {
			this.server.to(client.id).emit('error', 'Cannot find board');
			return;
		}

		// this.server.on('connection', (socket) => {
		//     socket.join(body.id);
		//     this.server.to(body.id).emit('message', 'hello');
		// })
	}
}

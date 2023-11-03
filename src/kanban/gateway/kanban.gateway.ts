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

export const EVENTS = {
	NEW_BOARD: 'new-board',
	BOARD_UPDATED: 'board-updated',
	BOARD_DELETED: 'board-deleted',
	BOARD_ACTIVE_MEMBERS: 'board-active-members',
	BOARD_MEMBERS_UPDATED: 'board-members-updated',
	BOARD_JOIN: 'board-join',
	LIST_CREATED: 'list-created',
	LIST_UPDATED: 'list-updated',
	LIST_DELETED: 'list-deleted',
	LISTS_UPDATED: 'lists-updated',
	TASK_CREATED: 'task-created',
	TASK_UPDATED: 'task-updated',
	TASK_DELETED: 'task-deleted',
	LIST_TASKS_UPDATED: 'list-tasks-updated',
};

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class KanbanGateWay implements OnModuleInit, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly authenticationService: AuthenticationService,
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
	) {}
	onModuleInit() {
		this.server.on('connection', async (socket: Socket & { user: any }) => {
			const token = socket.handshake.headers.authorization?.split(' ')[1];
			if (!token) {
				this.server.to(socket.id).emit('error', 'Unauthorized');
				socket.disconnect();
			}
			// socket.join(socket.id);
			try {
				const res = await this.authenticationService.verifyToken(token);
				this.server
					.to(socket.id)
					.emit('authorized', 'hello ' + res.name + ' ' + res.id);
				//join each user's room with userid
				// socket.join(`${res.id}`);
				socket.user = res;
			} catch (e) {
				this.server.to(socket.id).emit('error', e);
				socket.disconnect();
			}
			socket.on('disconnecting', async () => {
				console.log('Client disconnecting:', socket.id);
				console.log('client disconnecting from rooms:', socket.rooms);
				let rooms = Array.from(socket.rooms);
				// always the board room since each socket can only connect to 2 rooms
				const boardRoom = rooms[1];

				//update active members in board after user left
				const activeMembers = (
					await this.server.in(boardRoom).fetchSockets()
				).map((socket: any) => {
					return socket.user;
				});
				const activeMembersMap = new Map();
				activeMembers.map((member) => {
					activeMembersMap.set(member.id, member);
				});
				console.log(activeMembersMap);
				this.server.to(boardRoom).emit(EVENTS.BOARD_ACTIVE_MEMBERS, {
					activeMembers: Array.from(activeMembersMap.values()),
				});
				// socket.rooms.forEach((room) => {
				// 	this.server
				// 		.to(room)
				// 		.except(`${socket.user.id}`)
				// 		.emit(EVENTS.BOARD_ACTIVE_MEMBERS, {
				// 			id: socket.user.id,
				// 			email: socket.user.email,
				// 			name: socket.user.name,
				// 		});
				// });
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
	@SubscribeMessage(EVENTS.BOARD_JOIN)
	async onJoinBoard(client: Socket & { user: any }, data) {
		console.log(data);
		if (client.rooms.size === 2 && client.rooms.has(data.id)) {
			this.server
				.to(client.id)
				.emit('error', 'You can only join one board per socket');
			return;
		}
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

			//update room's active members list when user joins
			const activeMembers = (
				await this.server.in(data.id).fetchSockets()
			).map((socket: any) => {
				return socket.user;
			});
			const activeMembersMap = new Map();
			activeMembers.map((member) => {
				activeMembersMap.set(member.id, member);
			});
			console.log(activeMembersMap);
			this.server.to(board.id).emit(EVENTS.BOARD_ACTIVE_MEMBERS, {
				activeMembers: Array.from(activeMembersMap.values()),
			});
		} catch (e) {
			this.server.to(client.id).emit('error', 'Cannot join board');
			return;
		}

		// this.server.on('connection', (socket) => {
		//     socket.join(body.id);
		//     this.server.to(body.id).emit('message', 'hello');
		// })
	}
}

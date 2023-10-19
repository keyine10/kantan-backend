import {
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActiveUserData } from '../../auth/interfaces/active-user-data.interface';
import { KanbanGateWay } from '../gateway/kanban.gateway';
@Injectable()
export class BoardsService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@Inject(KanbanGateWay)
		private readonly kanbanGateway: KanbanGateWay,
	) {}
	async create(createBoardDto: CreateBoardDto, user: ActiveUserData) {
		const userInDb = await this.userRepository.findOneBy({ id: user.id });
		const createBoard = await this.boardRepository.create({
			...createBoardDto,
			creatorId: userInDb.id,
			members: [userInDb],
		});
		const savedBoard = await this.boardRepository.save(createBoard);
		return savedBoard;
	}
	findAll(user: ActiveUserData) {
		return this.boardRepository.find({
			// user is creator or a member
			where: [
				{ creator: [{ id: user.id }] },
				{ members: [{ id: user.id }] },
			],
			relations: ['members'],
			order: {
				createdAt: 'DESC',
			},
		});
	}

	async findOne(id: string, user: ActiveUserData) {
		let board = await this.boardRepository.findOne({
			// user must be a member
			where: [{ id, members: [{ id: user.id }] }],
			relations: ['lists.tasks', 'members', 'creator'],
			order: {
				lists: {
					position: 'ASC',
					tasks: {
						position: 'ASC',
					},
				},
			},
		});
		if (!board)
			throw new NotFoundException(
				"Board doesn't exist or user is unauthorized",
			);
		this.kanbanGateway.server
			.to(board.id)
			.emit('message', 'hello from board services findOne()');
		return board;
	}

	async update(
		id: string,
		updateBoardDto: UpdateBoardDto,
		user: ActiveUserData,
	) {
		const boardInDb = await this.authorizeBoardMembers(id, user);
		let updatedBoard = await this.boardRepository.preload({
			id: id,
			...updateBoardDto,
		});

		let connectedUsers = await this.kanbanGateway.server
			.in(boardInDb.id)
			.fetchSockets();
		let sender = connectedUsers.find((socket: any) => {
			return socket.user.id === user.id;
		});
		const savedBoard = await this.boardRepository.save(updatedBoard);

		this.kanbanGateway.server.to(boardInDb.id).emit('message', {
			message: 'hello from board services update()',
			content: savedBoard,
			sender: user.id,
		});

		return savedBoard;
	}

	async remove(id: string, user: ActiveUserData) {
		let board = await this.boardRepository.findOneBy({
			id,
		});
		if (!board)
			return new NotFoundException(
				`Cannot find Board with id ${id} or user is unauthorized`,
			);
		if (board.creatorId !== user.id) return new UnauthorizedException();
		await this.boardRepository.remove(board);
		return;
	}
	async authorizeBoardMembers(boardId: string, user: ActiveUserData) {
		const boardInDb = await this.boardRepository.findOne({
			where: { id: boardId },
			relations: ['members'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			throw new UnauthorizedException(
				'User does not have access to board',
			);
		}
		return boardInDb;
	}
	async addMember(id: string, memberId: string, user: ActiveUserData) {
		const boardInDb = await this.boardRepository.findOne({
			where: { id },
			relations: ['members'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (boardInDb.creatorId !== user.id)
			throw new UnauthorizedException(
				'User does not have permission to add member',
			);
		//TODO: add member
		return;
	}
	async removeMember(id: string, memberId: string, user: ActiveUserData) {
		const boardInDb = await this.boardRepository.findOne({
			where: { id },
			relations: ['members'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (boardInDb.creatorId !== user.id)
			throw new UnauthorizedException(
				'User does not have permission to remove member',
			);

		//TODO: remove member
		return;
	}
}

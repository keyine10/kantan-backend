import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { ArrayContains, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Injectable()
export class BoardsService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
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
			where: [
				{ creator: [{ id: user.id }] },
				{ members: [{ id: user.id }] },
			],
		});
	}

	//TODO: add member check
	async findOne(id: string, user: ActiveUserData) {
		let board = await this.boardRepository.findOne({
			where: [{ id, creatorId: user.id }],
			relations: ['lists', 'tasks', 'members', 'creator'],
		});
		if (!board) throw new NotFoundException();
		return board;
	}

	async update(
		id: string,
		updateBoardDto: UpdateBoardDto,
		user: ActiveUserData,
	) {
		let board = await this.boardRepository.findOneBy({ id });
		if (!board)
			throw new NotFoundException(`Cannot find Board with id ${id}`);
		if (
			board.creatorId !== user.id
			// && !board.membersId.includes(user.id)
		) {
			console.log(board.creatorId, user.id);
			throw new UnauthorizedException();
		}
		let updatedBoard = await this.boardRepository.preload({
			id: id,
			...updateBoardDto,
		});

		return updatedBoard;
	}

	async remove(id: string, user: ActiveUserData) {
		let board = await this.boardRepository.findOneBy({
			id,
			creatorId: user.id,
		});
		if (!board)
			return new NotFoundException(
				`Cannot find Board with id ${id} or user is unauthorized`,
			);
		await this.boardRepository.remove(board);
		return;
	}
}

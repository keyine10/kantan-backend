import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { List } from './entities/list.entity';
import { Repository } from 'typeorm';
import { Board } from '../boards/entities/board.entity';
import { ActiveUserData } from '../../auth/interfaces/active-user-data.interface';
import { isUUID } from 'class-validator';
@Injectable()
export class ListsService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(List)
		private readonly listRepository: Repository<List>,
	) {}

	async create(createListDto: CreateListDto, user: ActiveUserData) {
		if (!isUUID(createListDto.boardId))
			throw new BadRequestException('Board id is not valid UUID');
		const boardInDb = await this.boardRepository.findOne({
			where: { id: createListDto.boardId },
			relations: ['members'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		const newList = this.listRepository.create({
			...createListDto,
			board: boardInDb,
		});
		return this.listRepository.save(newList);
	}

	async findAll(boardId: string, user: ActiveUserData) {
		if (!isUUID(boardId))
			throw new BadRequestException('Board id is not valid UUID');
		const boardInDb = await this.boardRepository.findOne({
			where: { id: boardId },
			relations: ['members'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let listsInDb = await this.listRepository.find({
			where: [{ board: { id: boardId } }],
			relations: ['tasks'],
		});
		return listsInDb;
	}

	async findOne(id: string, user: ActiveUserData) {
		let listInDb = await this.listRepository.findOne({
			where: { id },
			relations: ['tasks', 'board.members'],
		});

		if (!listInDb) {
			return new NotFoundException('List does not exist');
		}

		if (!listInDb.board.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		if (!listInDb) throw new NotFoundException('List does not exist');
		return listInDb;
	}

	async update(
		id: string,
		updateListDto: UpdateListDto,
		user: ActiveUserData,
	) {
		const listInDb = await this.listRepository.findOne({
			where: { id },
			relations: ['board.members'],
		});

		if (!listInDb) {
			return new NotFoundException('List does not exist');
		}

		if (!listInDb.board.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		const newList = await this.listRepository.preload({
			id: id,
			...updateListDto,
		});
		return this.listRepository.save(newList);
	}

	async remove(id: string, user: ActiveUserData) {
		const listInDb = await this.listRepository.findOne({
			where: { id },
			relations: ['board.members'],
		});

		if (!listInDb) {
			return new NotFoundException('List does not exist');
		}

		if (!listInDb.board.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		await this.listRepository.remove(listInDb);
		return;
	}
}

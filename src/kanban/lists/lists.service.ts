import {
	BadRequestException,
	Inject,
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
import { EVENTS, KanbanGateWay } from '../gateway/kanban.gateway';
import { POSITION_INTERVAL } from '../common/constants';
@Injectable()
export class ListsService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(List)
		private readonly listRepository: Repository<List>,
		@Inject(KanbanGateWay)
		private readonly kanbanGateway: KanbanGateWay,
	) {}

	async create(createListDto: CreateListDto, user: ActiveUserData) {
		if (!isUUID(createListDto.boardId))
			throw new BadRequestException('Board id is not valid UUID');
		const boardInDb = await this.boardRepository.findOne({
			where: { id: createListDto.boardId },
			relations: ['members', 'lists'],
		});
		if (!boardInDb) throw new NotFoundException('Cannot find board');
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let position =
			boardInDb.lists.length > 0
				? boardInDb.lists[boardInDb.lists.length - 1]?.position +
				  POSITION_INTERVAL
				: POSITION_INTERVAL;
		const newList = this.listRepository.create({
			...createListDto,
			board: boardInDb,
			tasks: [],
			position: position,
		});
		let savedList = await this.listRepository.save(newList);
		this.kanbanGateway.server.emit(EVENTS.LIST_CREATED, {
			message: 'List created',
			content: savedList,
		});
		return savedList;
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
			order: {
				tasks: {
					position: 'ASC',
				},
			},
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
		console.log(listInDb);
		if (!listInDb) {
			return new NotFoundException('List does not exist');
		}

		if (!listInDb.board.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		const newList = await this.listRepository.preload({
			...listInDb,
			id: id,
			...updateListDto,
		});
		let savedList = await this.listRepository.save(newList);
		delete savedList.board;
		delete listInDb.board;
		this.kanbanGateway.server.emit(EVENTS.LIST_UPDATED, {
			message: 'List Updated',
			content: savedList,
			sender: user.id,
			_old: listInDb,
		});
		return savedList;
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
		delete listInDb.board;
		this.kanbanGateway.server.emit(EVENTS.LIST_DELETED, {
			message: 'List deleted',
			sender: user.id,
			content: { ...listInDb, id },
		});
		return;
	}
}

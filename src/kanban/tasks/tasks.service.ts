import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { List } from '../lists/entities/list.entity';
import { Board } from '../boards/entities/board.entity';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(List)
		private readonly listRepository: Repository<List>,
		@InjectRepository(Task)
		private readonly taskRepository: Repository<Task>,
	) {}
	async create(createTaskDto: CreateTaskDto, user: ActiveUserData) {
		const listInDb = await this.listRepository.findOne({
			where: { id: createTaskDto.listId },
			relations: ['tasks', 'board.members', 'board.creator'],
		});
		if (!listInDb) return new NotFoundException('List not found');

		const boardInDb = listInDb.board;
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}

		let newTask = this.taskRepository.create({
			...createTaskDto,
			list: listInDb,
			board: boardInDb,
			creator: boardInDb.creator,
		});

		return this.taskRepository.save(newTask);
	}

	findAll() {
		return `This action returns all tasks`;
	}

	async findOne(id: string, user: ActiveUserData) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'creator'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		const listInDb = taskInDb.list;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
	}

	async update(
		id: string,
		updateTaskDto: UpdateTaskDto,
		user: ActiveUserData,
	) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'creator'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		const listInDb = taskInDb.list;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}

		const updatedTask = await this.taskRepository.preload({
			...taskInDb,
			...updateTaskDto,
		});

		return this.taskRepository.save(updatedTask);
	}

	async remove(id: string, user: ActiveUserData) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'creator'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}

		return this.taskRepository.remove(taskInDb);
	}
}
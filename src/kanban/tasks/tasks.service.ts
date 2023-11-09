import {
	Inject,
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
import { ActiveUserData } from '../../auth/interfaces/active-user-data.interface';
import { POSITION_INTERVAL } from '../common/constants';
import { EVENTS, KanbanGateWay } from '../gateway/kanban.gateway';
import { AttachmentDto } from './dto/attachment.dto';
import { SupabaseService } from '../../commons/supabase.service';
@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(List)
		private readonly listRepository: Repository<List>,
		@InjectRepository(Task)
		private readonly taskRepository: Repository<Task>,
		@Inject(KanbanGateWay)
		private readonly kanbanGateway: KanbanGateWay,
		private readonly supabaseService: SupabaseService,
	) {}
	async create(createTaskDto: CreateTaskDto, user: ActiveUserData) {
		const listInDb = await this.listRepository.findOne({
			where: { id: createTaskDto.listId },
			relations: ['tasks', 'board.members', 'board.creator'],
		});
		if (!listInDb) return new NotFoundException('List not found');

		const boardInDb = listInDb.board;
		const boardId = boardInDb.id;
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let position =
			listInDb.tasks.length > 0
				? listInDb.tasks[listInDb.tasks.length - 1]?.position +
				  POSITION_INTERVAL
				: POSITION_INTERVAL;
		let newTask = this.taskRepository.create({
			...createTaskDto,
			list: listInDb,
			board: boardInDb,
			creator: boardInDb.creator,
			position: position,
			attachments: [],
		});

		let savedTask = await this.taskRepository.save(newTask);
		let returnedTask = {
			name: savedTask.name,
			position: savedTask.position,
			id: savedTask.id,
			description: savedTask.description,
			createdAt: savedTask.createdAt,
			updatedAt: savedTask.updatedAt,
			listId: savedTask.list.id,
		};
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_CREATED, {
			message: 'Task created',
			content: returnedTask,
			sender: user.id,
		});
		return returnedTask;
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
		return taskInDb;
	}

	async update(
		id: string,
		updateTaskDto: UpdateTaskDto,
		user: ActiveUserData,
	) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'creator', 'attachments'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		const boardId = boardInDb.id;
		const listInDb = taskInDb.list;
		const updatedList = await this.listRepository.findOne({
			where: { id: updateTaskDto.listId },
		});
		if (updatedList !== listInDb) {
			console.log('update task into a new list');
		}
		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		const preloadTask = {
			...taskInDb,
			...updateTaskDto,
		};
		if (listInDb !== updatedList) {
			preloadTask.list = updatedList;
		}
		const updatedTask = await this.taskRepository.preload(preloadTask);
		//TODO: reorder tasks in list if position between tasks are too small
		let savedTask = await this.taskRepository.save(updatedTask);
		delete taskInDb.board;
		delete savedTask.board;
		delete savedTask.list;
		delete taskInDb.list;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Task Updated',
			content: savedTask,
			sender: user.id,
			_old: taskInDb,
		});
		return savedTask;
	}

	async remove(id: string, user: ActiveUserData) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let boardId = boardInDb.id;

		await this.taskRepository.remove(taskInDb);
		delete taskInDb.board;
		delete taskInDb.list;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_DELETED, {
			message: 'Task Deleted',
			content: { ...taskInDb, id },
			sender: user.id,
		});
		return;
	}
	async addAttachment(id: string, user: ActiveUserData, file: AttachmentDto) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'attachments'],
		});
	}
}

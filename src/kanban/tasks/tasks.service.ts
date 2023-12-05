import {
	BadRequestException,
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
import { EVENTS, KanbanGateway } from '../gateway/kanban.gateway';
import { AttachmentDto } from './dto/attachment.dto';
import { SupabaseService } from '../../commons/supabase.service';
import { Attachment } from './entities/attachment.entity';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(List)
		private readonly listRepository: Repository<List>,
		@InjectRepository(Task)
		private readonly taskRepository: Repository<Task>,
		@InjectRepository(Attachment)
		private readonly attachmentRepository: Repository<Attachment>,
		@InjectRepository(Tag)
		private readonly tagRepository: Repository<Tag>,
		@Inject(KanbanGateway)
		private readonly kanbanGateway: KanbanGateway,

		private readonly supabaseService: SupabaseService,
	) {}
	async create(createTaskDto: CreateTaskDto, user: ActiveUserData) {
		const listInDb = await this.listRepository.findOne({
			where: { id: createTaskDto.listId },
			relations: ['tasks', 'board.members', 'board.creator'],
			order: {
				tasks: {
					position: 'ASC',
				},
			},
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
			tags: [],
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
			boardId: savedTask.board.id,
			creatorId: savedTask.creator.id,
			attachments: savedTask.attachments,
			tags: [],
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
			relations: [
				'list',
				'board.members',
				'creator',
				'attachments',
				'tags',
			],
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
			relations: ['list', 'board.members', 'attachments'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let boardId = boardInDb.id;

		const attachments = taskInDb.attachments;
		let filePaths = attachments.map((attachment) => {
			return attachment.path;
		});

		this.supabaseService
			.getClient()
			.storage.from('attachment')
			.remove(filePaths);

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
			relations: ['list', 'board.members', 'attachments', 'tags'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		let boardId = boardInDb.id;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let findAttachment = await this.attachmentRepository.findOne({
			where: { path: file.path },
		});
		if (findAttachment) {
			return new BadRequestException('Attachment already exists');
		}
		let newAttachment = this.attachmentRepository.create({
			...file,
			task: taskInDb,
		});
		let savedAttachment = await this.attachmentRepository.save(
			newAttachment,
		);
		delete taskInDb.board;
		delete taskInDb.list;
		delete savedAttachment.task;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Attachment added',
			content: {
				...taskInDb,
				attachments: [...taskInDb.attachments, savedAttachment],
			},
			_old: taskInDb,
			sender: user.id,
		});
		return {
			...taskInDb,
			attachments: [...taskInDb.attachments, savedAttachment],
		};
	}
	async removeAttachment(
		id: string,
		user: ActiveUserData,
		attachmentId: string,
	) {
		let taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: ['list', 'board.members', 'attachments', 'tags'],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		let boardId = boardInDb.id;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		const attachment = await this.attachmentRepository.findOne({
			where: { id: attachmentId },
		});
		if (!attachment) return new NotFoundException('Attachment not found');
		await this.attachmentRepository.remove(attachment);
		if (taskInDb.backgroundAttachmentPath === attachment.path) {
			taskInDb.backgroundAttachmentPath = null;
			taskInDb = await this.taskRepository.save(taskInDb);
		}

		delete taskInDb.board;
		delete taskInDb.list;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Attachment removed',
			content: {
				...taskInDb,
				attachments: taskInDb.attachments.filter(
					(attachment) => attachment.id !== attachmentId,
				),
			},
			_old: taskInDb,
			sender: user.id,
		});
		return;
	}

	async addTag(id: string, user: ActiveUserData, tag: CreateTagDto) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: [
				'board.members',
				'board.members',
				'tags',
				'creator',
				'attachments',
			],
			order: {
				tags: {
					createdAt: 'ASC',
				},
			},
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		let boardId = boardInDb.id;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let newTag = this.tagRepository.create({
			...tag,
			task: taskInDb,
		});
		let savedTag = await this.tagRepository.save(newTag);
		delete taskInDb.board;
		delete taskInDb.list;
		delete savedTag.task;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Tag added',
			content: {
				...taskInDb,
				tags: [...taskInDb.tags, savedTag],
			},
			_old: taskInDb,
			sender: user.id,
		});
	}

	async updateTag(
		id: string,
		user: ActiveUserData,
		tagId: string,
		tag: UpdateTagDto,
	) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: [
				'board.members',
				'board.members',
				'tags',
				'creator',
				'attachments',
			],
			order: {
				tags: {
					createdAt: 'ASC',
				},
			},
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		let boardId = boardInDb.id;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}

		let findTag = await this.tagRepository.findOne({
			where: { id: tagId },
		});
		if (!findTag) return new NotFoundException('Tag not found');
		let preloadTag = await this.tagRepository.preload({
			...findTag,
			...tag,
		});
		let savedTag = await this.tagRepository.save(preloadTag);
		delete taskInDb.board;
		delete taskInDb.list;
		delete savedTag.task;

		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Tag updated',
			content: {
				...taskInDb,
				tags: taskInDb.tags.map((tag) => {
					if (tag.id === savedTag.id) {
						return savedTag;
					}
					return tag;
				}),
			},
			_old: taskInDb,
			sender: user.id,
		});
	}
	async removeTag(id: string, user: ActiveUserData, tagId: string) {
		const taskInDb = await this.taskRepository.findOne({
			where: { id },
			relations: [
				'board.members',
				'tags',
				'creator',
				'attachments',
				'tags',
			],
		});
		if (!taskInDb) return new NotFoundException('Task not found');

		const boardInDb = taskInDb.board;
		let boardId = boardInDb.id;

		if (!boardInDb.members.find((member) => member.id === user.id)) {
			return new UnauthorizedException(
				'User does not have access to board',
			);
		}
		let findTag = await this.tagRepository.findOne({
			where: { id: tagId },
		});
		if (!findTag) return new NotFoundException('Tag not found');
		await this.tagRepository.remove(findTag);
		delete taskInDb.board;
		this.kanbanGateway.server.to(boardId).emit(EVENTS.TASK_UPDATED, {
			message: 'Tag removed',
			content: {
				...taskInDb,
				tags: taskInDb.tags.filter((tag) => tag.id !== tagId),
			},
			_old: taskInDb,
			sender: user.id,
		});
	}
}

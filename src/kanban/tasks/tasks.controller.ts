import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from '../../auth/decorators/active-user/active-user.decorator';
import { AttachmentDto } from './dto/attachment.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@Post()
	create(@Body() createTaskDto: CreateTaskDto, @ActiveUser() user) {
		return this.tasksService.create(createTaskDto, user);
	}

	@Get()
	findAll() {
		return this.tasksService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string, @ActiveUser() user) {
		return this.tasksService.findOne(id, user);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateTaskDto: UpdateTaskDto,
		@ActiveUser() user,
	) {
		return this.tasksService.update(id, updateTaskDto, user);
	}

	@Delete(':id')
	remove(@Param('id') id: string, @ActiveUser() user) {
		return this.tasksService.remove(id, user);
	}

	@Post(':id/attachments')
	addAttachment(
		@Param('id') id: string,
		@Body() attachmentDto: AttachmentDto,
		@ActiveUser() user,
	) {
		return this.tasksService.addAttachment(id, user, attachmentDto);
	}

	@Delete(':id/attachments/:attachmentId')
	removeAttachment(
		@Param('id') id: string,
		@ActiveUser() user,
		@Param('attachmentId') attachmentId: string,
	) {
		return this.tasksService.removeAttachment(id, user, attachmentId);
	}

	@Post(':id/tags')
	addTag(
		@Param('id') id: string,
		@Body() CreateTagDto: CreateTagDto,
		@ActiveUser() user,
	) {
		return this.tasksService.addTag(id, user, CreateTagDto);
	}

	@Patch(':id/tags/:tagId')
	updateTag(
		@Param('id') id: string,
		@Body() UpdateTagDto: CreateTagDto,
		@ActiveUser() user,
		@Param('tagId') tagId: string,
	) {
		return this.tasksService.updateTag(id, user, tagId, UpdateTagDto);
	}

	@Delete(':id/tags/:tagId')
	removeTag(
		@Param('id') id: string,
		@ActiveUser() user,
		@Param('tagId') tagId: string,
	) {
		return this.tasksService.removeTag(id, user, tagId);
	}
}

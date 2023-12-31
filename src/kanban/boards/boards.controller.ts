import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	Query,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from '../../auth/decorators/active-user/active-user.decorator';
import { ActiveUserData } from '../../auth/interfaces/active-user-data.interface';
import { UpdateBoardMembersDto } from './dto/update-board-members.dto';
import { PaginationQueryDto } from '../common/pagination-query.dto';

@Controller('boards')
@ApiTags('Boards')
@ApiBearerAuth()
export class BoardsController {
	constructor(private readonly boardsService: BoardsService) {}

	@Post()
	create(
		@Body() createBoardDto: CreateBoardDto,
		@ActiveUser() user: ActiveUserData,
	) {
		return this.boardsService.create(createBoardDto, user);
	}
	//TODO: pagination query
	@Get()
	findAll(
		@ActiveUser() user: ActiveUserData,
		@Query() query: PaginationQueryDto,
	) {
		return this.boardsService.findAll(user, query);
	}

	@Get(':id')
	findOne(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
		return this.boardsService.findOne(id, user);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateBoardDto: UpdateBoardDto,
		@ActiveUser() user: ActiveUserData,
	) {
		return this.boardsService.update(id, updateBoardDto, user);
	}
	@HttpCode(204)
	@Delete(':id')
	remove(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
		return this.boardsService.remove(id, user);
	}

	@Post(':id/members/')
	addMember(
		@Param('id') id: string,
		@Body() updateBoardMembersDto: UpdateBoardMembersDto,
		@ActiveUser() user: ActiveUserData,
	) {
		return this.boardsService.addMember(
			id,
			updateBoardMembersDto.email,
			user,
		);
	}

	@Delete(':id/members/')
	removeMember(
		@Param('id') id: string,
		@Body() updateBoardMembersDto: UpdateBoardMembersDto,
		@ActiveUser() user: ActiveUserData,
	) {
		return this.boardsService.removeMember(
			id,
			updateBoardMembersDto.email,
			user,
		);
	}
}

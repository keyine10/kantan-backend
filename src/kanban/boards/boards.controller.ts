import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ActiveUser } from 'src/auth/decorators/active-user/active-user.decorator';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Controller('boards')
export class BoardsController {
	constructor(private readonly boardsService: BoardsService) {}

	@Post()
	create(
		@Body() createBoardDto: CreateBoardDto,
		@ActiveUser() user: ActiveUserData,
	) {
		return this.boardsService.create(createBoardDto, user);
	}

	@Get()
	findAll(@ActiveUser() user: ActiveUserData) {
		return this.boardsService.findAll(user);
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
}

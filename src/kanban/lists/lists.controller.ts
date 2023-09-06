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
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorators/active-user/active-user.decorator';
import { ListFindAllParams } from './dto/list-params.dto';

@ApiTags('Lists')
@ApiBearerAuth()
@Controller('lists')
export class ListsController {
	constructor(private readonly listsService: ListsService) {}

	@Post()
	create(@Body() createListDto: CreateListDto, @ActiveUser() user) {
		return this.listsService.create(createListDto, user);
	}

	@Get()
	findAll(@Body() { boardId }: ListFindAllParams, @ActiveUser() user) {
		return this.listsService.findAll(boardId, user);
	}

	@Get(':id')
	findOne(@Param('id') id: string, @ActiveUser() user) {
		return this.listsService.findOne(id, user);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateListDto: UpdateListDto,
		@ActiveUser() user,
	) {
		return this.listsService.update(id, updateListDto, user);
	}

	@Delete(':id')
	@HttpCode(204)
	remove(@Param('id') id: string, @ActiveUser() user) {
		return this.listsService.remove(id, user);
	}
}

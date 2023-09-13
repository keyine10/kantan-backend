import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Delete,
	UnauthorizedException,
	HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from '../auth/decorators/active-user/active-user.decorator';
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id')
	findOne(@Param('id') id: string, @ActiveUser() user) {
		if (user.id !== +id) {
			throw new UnauthorizedException();
		}
		return this.usersService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@ActiveUser() user,
		@Body() updateUserDto: UpdateUserDto,
	) {
		if (user.id !== +id) {
			throw new UnauthorizedException();
		}
		return this.usersService.update(+id, updateUserDto, user);
	}
	@HttpCode(204)
	@Delete(':id')
	remove(@Param('id') id: string, @ActiveUser() user) {
		return this.usersService.remove(+id, user);
	}
}

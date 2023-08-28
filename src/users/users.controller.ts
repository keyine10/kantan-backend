import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Delete,
	UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActiveUser } from 'src/auth/decorators/active-user/active-user.decorator';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@ActiveUser() user,
		@Body() updateUserDto: UpdateUserDto,
	) {
		if (user.id !== +id) {
			throw UnauthorizedException;
		}
		return this.usersService.update(+id, updateUserDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(+id);
	}
}

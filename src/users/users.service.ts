import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}
	// findAll() {
	// 	// return this.userRepository.find();
	// 	return `This action returns all users`;
	// }

	async findOne(id: number) {
		let user = await this.userRepository.findOneBy({ id });
		if (!user) throw new NotFoundException('User not found');
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.bio,
		};
	}

	async update(
		id: number,
		updateUserDto: UpdateUserDto,
		user: ActiveUserData,
	) {
		let userInDb = await this.userRepository.findOneBy({ id });
		userInDb = {
			...userInDb,
			...updateUserDto,
		};
		let updated = await this.userRepository.save(user);
		return {
			id: userInDb.id,
			name: userInDb.name,
			email: userInDb.email,
			bio: userInDb.bio,
		};
	}

	remove(id: number, user: ActiveUserData) {
		if (user.id !== id) {
			throw new UnauthorizedException();
		}
		return this.userRepository.delete({ id });
	}
}

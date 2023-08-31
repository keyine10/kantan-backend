import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

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

	async update(id: number, updateUserDto: UpdateUserDto) {
		let user = await this.userRepository.findOneBy({ id });
		user = {
			...user,
			...updateUserDto,
		};
		let updated = await this.userRepository.save(user);
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.bio,
		};
	}

	// remove(id: number) {
	// 	return `This action removes a #${id} user`;
	// }
}

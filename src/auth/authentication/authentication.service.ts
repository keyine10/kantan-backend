import {
	ConflictException,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/entities/user.entity';
import { Board } from '../../kanban/boards/entities/board.entity';

@Injectable()
export class AuthenticationService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		private readonly hashingService: HashingService,
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
	) {}

	async verifyToken(token: string) {
		try {
			const decoded = await this.jwtService.verifyAsync(token, {
				...this.jwtConfiguration,
			});
			// request.user = decoded;
			return decoded;
		} catch (err) {
			throw new UnauthorizedException();
		}
		return true;
	}

	async signUp(signUpDto: SignUpDto) {
		try {
			const user = new User();
			user.email = signUpDto.email;
			user.name = signUpDto.name;
			user.password = await this.hashingService.hash(signUpDto.password);
			const savedUser = await this.userRepository.save(user);
			// find all boards with user's email in their pendingMembers and add the user to board
			const boards = await this.boardRepository.find({
				where: {
					pendingMembers: ArrayContains([user.email]),
				},
				relations: ['members'],
			});
			Promise.all(
				boards.map(async (board) => {
					board.members.push(savedUser);
					board.pendingMembers = board.pendingMembers.filter(
						(email) => email !== user.email,
					);

					return this.boardRepository.save(board);
				}),
			);
			console.log('boards member of:', boards);
			return {
				id: savedUser.id,
				name: savedUser.name,
				email: savedUser.email,
			};
		} catch (err) {
			if (err.code === '23505') throw new ConflictException();
			throw err;
		}
	}
	async signIn(signInDto: SignInDto) {
		const user = await this.userRepository.findOne({
			where: { email: signInDto.email },
			select: ['id', 'password', 'name', 'email', 'bio'],
		});
		if (!user) throw new ConflictException();
		let compare = await this.hashingService.compare(
			signInDto.password,
			user.password,
		);

		if (!compare) throw new ConflictException();

		const options = {
			secret: this.jwtConfiguration.secret,
			expiresIn: this.jwtConfiguration.accessTokenTtl,
			issuer: this.jwtConfiguration.issuer,
			audience: this.jwtConfiguration.audience,
		};
		const accessToken = this.jwtService.sign(
			{
				id: user.id,
				email: user.email,
				name: user.name,
			},
			options,
		);
		// console.log(await this.jwtService.verifyAsync(accessToken, options));
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.bio,
			accessToken,
		};
	}
}

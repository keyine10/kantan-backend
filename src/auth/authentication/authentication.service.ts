import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { User } from 'src/users/entities/user.entity';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthenticationService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly hashingService: HashingService,
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
	) {}

	async signUp(signUpDto: SignUpDto) {
		try {
			const user = new User();
			user.email = signUpDto.email;
			user.name = signUpDto.name;
			user.password = await this.hashingService.hash(signUpDto.password);
			await this.userRepository.save(user);
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
		// TODO: password comparison doesnt work, any password will login
		let compare = await this.hashingService.compare(
			signInDto.password,
			user.password,
		);

		if (!compare) throw new ConflictException();

		const accessToken = this.jwtService.sign(
			{
				id: user.id,
				email: user.email,
				name: user.name,
			},
			{
				secret: this.jwtConfiguration.secret,
				expiresIn: this.jwtConfiguration.accessTokenTtl,
				issuer: this.jwtConfiguration.issuer,
				audience: this.jwtConfiguration.audience,
			},
		);
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.bio,
			accessToken,
		};
	}
}

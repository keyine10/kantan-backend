import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { User } from 'src/users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from './authentication/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationGuard } from './authentication/guards/authentication/authentication.guard';
import { AccessTokenGuard } from './authentication/guards/access-token/access-token.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		ConfigModule.forFeature(jwtConfig),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: jwtConfig,
		}),
	],
	controllers: [AuthenticationController],
	providers: [
		{
			provide: HashingService,
			useClass: BcryptService,
		},
		{ provide: 'APP_GUARD', useClass: AuthenticationGuard },
		AccessTokenGuard,
		AuthenticationService,
	],
})
export class AuthModule {}

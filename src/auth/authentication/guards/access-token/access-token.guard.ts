import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from '../../config/jwt.config';

@Injectable()
export class AccessTokenGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration,
	) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) throw new UnauthorizedException();
		try {
			const decoded = await this.jwtService.verifyAsync(token, {
				...this.jwtConfiguration,
			});
			request.user = decoded;
		} catch (err) {
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string {
		const [_, token] = request.headers.authorization?.split(' ') ?? [];
		return token;
	}
}

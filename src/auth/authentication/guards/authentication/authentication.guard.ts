import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AUTH_TYPE_KEY } from '../../decorators/auth.decorator';
import { AuthType } from '../../enums/auth-type.enum';

@Injectable()
export class AuthenticationGuard implements CanActivate {
	private static defaultAuthType = AuthType.Bearer;

	// maps auth types to their guards
	private readonly authTypesToGuardsMap = {
		[AuthType.Bearer]: this.accessTokenGuard,
		[AuthType.None]: { canActivate: () => true },
	};
	constructor(
		private readonly accessTokenGuard: AccessTokenGuard,

		private readonly reflector: Reflector,
	) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const authtypes = this.reflector.getAllAndOverride(AUTH_TYPE_KEY, [
			context.getClass(),
			context.getHandler(),
		]) ?? [AuthenticationGuard.defaultAuthType];
		let error = new UnauthorizedException();
		const guards = authtypes.map(
			(authtype) => this.authTypesToGuardsMap[authtype],
		);

		//for each auth guards, run canActivate
		for (const guard of guards) {
			const canActivate = await Promise.resolve(
				guard.canActivate(context),
			).catch((err) => {
				error = err;
			});
			if (canActivate) {
				return true;
			}
		}
		throw error;
	}
}

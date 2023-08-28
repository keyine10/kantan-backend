import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { User } from 'src/users/entities/user.entity';

export const ActiveUser = createParamDecorator(
	(field: keyof ActiveUserData, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user;
		return field ? user?.[field] : user;
	},
);

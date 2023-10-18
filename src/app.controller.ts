import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthType } from './auth/authentication/enums/auth-type.enum';
import { Auth } from './auth/authentication/decorators/auth.decorator';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}
	@Auth(AuthType.None)
	@Get()
	getHello(): string {
		return this.appService.getHello();
	}
}

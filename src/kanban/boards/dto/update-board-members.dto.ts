import { IsEmail, MinLength } from 'class-validator';

export class UpdateBoardMembersDto {
	@IsEmail()
	@MinLength(1)
	email: string;
}

import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateListDto {
	@IsString()
	@MinLength(1)
	@MaxLength(20)
	name: string;
}

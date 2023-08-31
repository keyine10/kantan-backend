import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
	@IsString()
	@MaxLength(20)
	@MinLength(4)
	@IsOptional()
	name: string;

	@IsString()
	@MaxLength(255)
	@IsOptional()
	bio: string;
}

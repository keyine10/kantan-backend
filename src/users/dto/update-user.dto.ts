import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
	@IsString()
	@MaxLength(20)
	@MinLength(4)
	@IsOptional()
	@ApiPropertyOptional()
	name: string;

	@IsString()
	@MaxLength(255)
	@IsOptional()
	@ApiPropertyOptional()
	bio: string;
}

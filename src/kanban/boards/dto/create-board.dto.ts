import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBoardDto {
	@IsString()
	@MinLength(1)
	title: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	description: string;
}

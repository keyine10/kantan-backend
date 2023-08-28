import { IsOptional, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
	@IsPositive()
	@IsOptional()
	@ApiPropertyOptional()
	offset: number;
	@IsPositive()
	@IsOptional()
	@ApiPropertyOptional()
	limit: number;
}

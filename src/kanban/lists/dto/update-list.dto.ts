import { PartialType } from '@nestjs/swagger';
import { CreateListDto } from './create-list.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateListDto extends PartialType(CreateListDto) {
	@IsString()
	boardId: string;
	@IsBoolean()
	@IsOptional()
	rebalance: boolean;
}

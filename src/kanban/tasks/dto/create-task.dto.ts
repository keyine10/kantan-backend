import {
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';
import { POSITION_INTERVAL } from 'src/kanban/common/constants';

export class CreateTaskDto {
	@IsString()
	@MinLength(1)
	@MaxLength(50)
	name: string;

	@IsString()
	listId: string;

	@IsString()
	boardId: string;

	@IsNumber()
	@Max(POSITION_INTERVAL * 1000)
	@Min(0.25)
	position: number;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	@MinLength(1)
	description: string;
}

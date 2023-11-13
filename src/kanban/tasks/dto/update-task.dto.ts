import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
	@IsOptional()
	@IsString()
	@IsHexColor()
	backgroundColor: string;
}

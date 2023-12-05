import {
	IsHexColor,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class CreateTagDto {
	@IsString()
	@MinLength(1)
	@MaxLength(50)
	name: string;

	@IsString()
	@IsOptional()
	@IsHexColor()
	backgroundColor: string;
}

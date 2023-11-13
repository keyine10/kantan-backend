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
	@MaxLength(255)
	name: string;

	@IsString()
	@IsOptional()
	@IsHexColor()
	backgroundColor: string;
}

import { IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class AttachmentDto {
	@IsString()
	@MinLength(1)
	@MaxLength(255)
	name: string;

	@IsNumber()
	size: number;

	@IsString()
	mimetype: string;

	@IsString()
	path: string;
}

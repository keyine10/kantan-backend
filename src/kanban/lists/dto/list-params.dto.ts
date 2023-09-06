import { IsString } from 'class-validator';

export class ListFindAllParams {
	@IsString()
	boardId: string;
}

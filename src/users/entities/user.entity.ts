import { Board } from 'src/kanban/boards/entities/board.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;
	@Column()
	name: string;
	@Column({ unique: true })
	email: string;
	@Column()
	password: string;

	@OneToMany((type) => Board, (board) => board.user)
	boards: Board[];
}

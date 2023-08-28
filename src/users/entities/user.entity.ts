import { Board } from 'src/kanban/boards/entities/board.entity';
import { Task } from 'src/kanban/tasks/entities/task.entity';
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

	@OneToMany((type) => Task, (task) => task.user)
	tasks: Task[];
}

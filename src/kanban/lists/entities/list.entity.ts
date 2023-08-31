import { Board } from 'src/kanban/boards/entities/board.entity';
import { Task } from 'src/kanban/tasks/entities/task.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
} from 'typeorm';

@Entity('lists')
export class List {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column()
	position: number;

	@ManyToOne(() => Board, (board) => board.lists)
	board: Board;

	@OneToMany(() => Task, (task) => task.list)
	tasks: Task[];

	// Add more properties and methods as needed
}

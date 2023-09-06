import { Max, Min } from 'class-validator';
import { POSITION_INTERVAL } from 'src/kanban/boards/common/constants';
import { Board } from 'src/kanban/boards/entities/board.entity';
import { Task } from 'src/kanban/tasks/entities/task.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	Double,
} from 'typeorm';

@Entity('lists')
export class List {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ type: 'decimal', scale: 3 })
	@Max(POSITION_INTERVAL * 1000)
	@Min(1)
	position: number;

	@ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
	board: Board;

	@OneToMany(() => Task, (task) => task.list)
	tasks: Task[];

	// Add more properties and methods as needed
}

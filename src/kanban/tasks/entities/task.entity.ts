import { Board } from 'src/kanban/boards/entities/board.entity';
import { List } from 'src/kanban/lists/entities/list.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
} from 'typeorm';

@Entity('tasks')
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column()
	description: string;

	@Column()
	position: number;

	@ManyToOne(() => List, (list) => list.tasks)
	list: List;

	@ManyToOne(() => Board, (board) => board.tasks)
	board: Board;

	@ManyToOne(() => User, (user) => user.tasks)
	creator: User;

	// TODO: checklists and labels
	// @OneToMany(() => Checklist, (checklist) => checklist.task)
	// checklists: Checklist[];

	// @OneToMany(() => Label, (label) => label.task)
	// labels: Label[];

	// Add more properties and methods as needed
}

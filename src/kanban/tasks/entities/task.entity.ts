import { Max, Min } from 'class-validator';
import { POSITION_INTERVAL } from 'src/kanban/boards/common/constants';
import { Board } from 'src/kanban/boards/entities/board.entity';
import { List } from 'src/kanban/lists/entities/list.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('tasks')
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column()
	description: string;

	@Column({ type: 'decimal', precision: 10, scale: 3 })
	@Max(POSITION_INTERVAL * 1000)
	@Min(1)
	position: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@ManyToOne(() => List, (list) => list.tasks, { onDelete: 'CASCADE' })
	list: List;

	@ManyToOne(() => Board, (board) => board.tasks, { onDelete: 'CASCADE' })
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

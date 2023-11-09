import { Max, Min } from 'class-validator';

import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
	JoinColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Board } from '../../boards/entities/board.entity';
import { List } from '../../lists/entities/list.entity';
import { DecimalColumnTransformer } from '../../../commons/utils/decimal-transformer';
import { Attachment } from './attachment.entity';

@Entity('tasks')
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ nullable: true })
	description: string;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 3,
		transformer: new DecimalColumnTransformer(),
	})
	@Min(1)
	position: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@ManyToOne(() => List, (list) => list.tasks, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'listId', referencedColumnName: 'id' })
	list: List;

	@Column()
	listId: string;

	@ManyToOne(() => Board, (board) => board.tasks, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'boardId', referencedColumnName: 'id' })
	board: Board;

	@Column()
	boardId: string;

	@ManyToOne(() => User, (user) => user.tasks)
	creator: User;

	// TODO: checklists and labels
	// @OneToMany(() => Checklist, (checklist) => checklist.task)
	// checklists: Checklist[];

	@OneToMany(() => Attachment, (attachment) => attachment.task, {
		onDelete: 'CASCADE',
		nullable: true,
	})
	attachments: Attachment[];

	// @OneToMany(() => Label, (label) => label.task)
	// labels: Label[];

	// Add more properties and methods as needed
}

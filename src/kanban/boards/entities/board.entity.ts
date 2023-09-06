import { List } from 'src/kanban/lists/entities/list.entity';
import { Task } from 'src/kanban/tasks/entities/task.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	JoinTable,
	ManyToMany,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Board {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@Column({ nullable: true })
	description: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@ManyToOne(() => User, (user) => user.boards)
	@JoinColumn({ name: 'creatorId', referencedColumnName: 'id' })
	creator: User;

	@Column()
	creatorId: number;

	// @JoinColumn({ name: 'membersId', referencedColumnName: 'id' })
	@ManyToMany(() => User, (user) => user.memberBoards)
	members: User[];

	@OneToMany(() => List, (list) => list.board, { onDelete: 'CASCADE' })
	lists: List[];

	@OneToMany(() => Task, (task) => task.board, { onDelete: 'CASCADE' })
	tasks: Task[];

	// Add more properties and methods as needed
}

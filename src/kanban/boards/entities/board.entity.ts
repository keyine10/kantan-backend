import { List } from '../../lists/entities/list.entity';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../../users/entities/user.entity';
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
import { ArrayMaxSize } from 'class-validator';

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

	@Column({ nullable: true })
	backgroundColor: string;

	// @JoinColumn({ name: 'membersId', referencedColumnName: 'id' })
	@ManyToMany(() => User, (user) => user.memberBoards)
	members: User[];

	@Column('text', { array: true, default: [] })
	pendingMembers: string[];

	@OneToMany(() => List, (list) => list.board, { onDelete: 'CASCADE' })
	@ArrayMaxSize(1000)
	lists: List[];

	@OneToMany(() => Task, (task) => task.board, { onDelete: 'CASCADE' })
	tasks: Task[];

	// Add more properties and methods as needed
}

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
} from 'typeorm';

@Entity()
export class Board {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	title: string;

	@ManyToOne(() => User, (user) => user.boards)
	@JoinColumn({ name: 'creatorId', referencedColumnName: 'id' })
	creator: User;

	@Column()
	creatorId: number;

	@Column({ nullable: true })
	description: string;

	@ManyToMany(() => User, (user) => user.boards)
	@JoinColumn({ name: 'membersId', referencedColumnName: 'id' })
	@JoinTable() // Required for many-to-many relationships
	members: User[];

	@Column('int', { array: true, default: [] })
	membersId: number[];

	@OneToMany(() => List, (list) => list.board)
	lists: List[];

	@OneToMany(() => Task, (task) => task.board)
	tasks: Task[];

	// Add more properties and methods as needed
}

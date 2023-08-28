import { List } from 'src/kanban/lists/entities/list.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
} from 'typeorm';

@Entity()
export class Board {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	title: string;

	@ManyToOne(() => User, (user) => user.boards)
	user: User;

	@Column({ nullable: true })
	description: string;

	@OneToMany(() => List, (list) => list.board)
	lists: List[];

	// Add more properties and methods as needed
}

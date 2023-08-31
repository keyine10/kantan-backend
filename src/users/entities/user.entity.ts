import { MaxLength } from 'class-validator';
import { Board } from 'src/kanban/boards/entities/board.entity';
import { Task } from 'src/kanban/tasks/entities/task.entity';
import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;
	@MaxLength(20)
	@Column()
	name: string;
	@Column({ unique: true })
	email: string;
	@MaxLength(255)
	@Column({ nullable: true })
	bio: string;
	@Column()
	password: string;

	@ManyToMany(() => Board, (board) => board.members)
	@JoinTable()
	boards: Board[];

	@OneToMany((type) => Task, (task) => task.creator)
	tasks: Task[];
}

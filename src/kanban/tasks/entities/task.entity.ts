import { List } from 'src/kanban/lists/entities/list.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
} from 'typeorm';

@Entity('tasks')
export class Task {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	title: string;

	@ManyToOne(() => List, (list) => list.tasks)
	list: List;

	// TODO: checklists and labels
	// @OneToMany(() => Checklist, (checklist) => checklist.task)
	// checklists: Checklist[];

	// @OneToMany(() => Label, (label) => label.task)
	// labels: Label[];

	// Add more properties and methods as needed
}

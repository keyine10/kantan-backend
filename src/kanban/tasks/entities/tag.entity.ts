import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';
import { Max } from 'class-validator';

@Entity('tags')
export class Tag {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Max(255)
	@Column({ nullable: false })
	name: string;

	@Column({ nullable: true })
	backgroundColor: string;

	@ManyToOne(() => Task, (task) => task.tags, { onDelete: 'CASCADE' })
	task: Task;
}

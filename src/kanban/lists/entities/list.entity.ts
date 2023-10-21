import { ArrayMaxSize, Max, Min } from 'class-validator';
import { POSITION_INTERVAL } from '../../common/constants';
import { Board } from '../../boards/entities/board.entity';
import { Task } from '../../tasks/entities/task.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	Double,
} from 'typeorm';
import { DecimalColumnTransformer } from '../../../commons/utils/decimal-transformer';

@Entity('lists')
export class List {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({
		type: 'decimal',
		scale: 3,
		transformer: new DecimalColumnTransformer(),
	})
	@Min(1)
	position: number;

	@ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
	board: Board;

	@OneToMany(() => Task, (task) => task.list, { onDelete: 'CASCADE' })
	@ArrayMaxSize(100)
	tasks: Task[];

	// Add more properties and methods as needed
}

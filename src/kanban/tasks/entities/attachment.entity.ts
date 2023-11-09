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
import { Task } from './task.entity';

@Entity('attachment')
export class Attachment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false })
	name: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@Column({ nullable: false })
	size: number;

	@Column()
	mimetype: string;

	@ManyToOne(() => Task, (task) => task.attachments)
	task: Task;
}

// {
//     "name": "PhotoshopPrefsManager-20230706-165505.log",
//     "id": "e591d4cc-478a-4b7d-b876-b5420dcffe7d",
//     "updated_at": "2023-11-08T09:54:08.696Z",
//     "created_at": "2023-11-08T09:54:08.696Z",
//     "last_accessed_at": "2023-11-08T09:54:08.696Z",
//     "metadata": {
//         "eTag": "\"bddaf162e07cf73e2150accb44e7fd26-1\"",
//         "size": 1240,
//         "mimetype": "text/plain",
//         "cacheControl": "no-cache",
//         "lastModified": "2023-11-08T09:54:09.000Z",
//         "contentLength": 1240,
//         "httpStatusCode": 200
//     }
// }

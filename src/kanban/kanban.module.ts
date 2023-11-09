import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Board } from './boards/entities/board.entity';
import { List } from './lists/entities/list.entity';
import { Task } from './tasks/entities/task.entity';
import { BoardsController } from './boards/boards.controller';
import { ListsController } from './lists/lists.controller';
import { TasksController } from './tasks/tasks.controller';
import { BoardsService } from './boards/boards.service';
import { ListsService } from './lists/lists.service';
import { TasksService } from './tasks/tasks.service';
import { AuthModule } from '../auth/auth.module';
import { KanbanWsModule } from './gateway/kanbanws.module';
import { Attachment } from './tasks/entities/attachment.entity';
import { SupabaseModule } from '../commons/supabase.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Board, List, Task, Attachment]),
		AuthModule,
		KanbanWsModule,
		SupabaseModule,
	],
	controllers: [BoardsController, ListsController, TasksController],
	providers: [BoardsService, ListsService, TasksService],
	exports: [],
})
export class KanbanModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Board } from './boards/entities/board.entity';
import { List } from './lists/entities/list.entity';
import { Task } from './tasks/entities/task.entity';
import { BoardsController } from './boards/boards.controller';
import { ListsController } from './lists/lists.controller';
import { TasksController } from './tasks/tasks.controller';
import { BoardsService } from './boards/boards.service';
import { ListsService } from './lists/lists.service';
import { TasksService } from './tasks/tasks.service';

@Module({
	imports: [TypeOrmModule.forFeature([User, Board, List, Task])],
	controllers: [BoardsController, ListsController, TasksController],
	providers: [BoardsService, ListsService, TasksService],
})
export class KanbanModule {}

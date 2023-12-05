import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { KanbanGateway } from './kanban.gateway';
import { BoardsService } from '../boards/boards.service';
import { KanbanModule } from '../kanban.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../boards/entities/board.entity';

@Module({
	imports: [AuthModule, TypeOrmModule.forFeature([Board])],
	providers: [KanbanGateway],
	exports: [KanbanGateway],
})
export class KanbanWsModule {}

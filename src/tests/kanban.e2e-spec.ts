import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { KanbanModule } from 'src/kanban/kanban.module';
import { UsersModule } from 'src/users/users.module';

describe('Kanban E2E', () => {
	let app: INestApplication;
	let testAccount = { email: '', password: '' };
	{
		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule(
				{
					imports: [
						KanbanModule,
						ConfigModule.forRoot(),
						TypeOrmModule.forRootAsync({
							useFactory: () => ({
								type: 'postgres',
								host: process.env.DATABASE_HOST,
								port: +process.env.DATABASE_PORT,
								username: process.env.DATABASE_USER,
								password: process.env.DATABASE_PASSWORD,
								database: process.env.DATABASE_NAME,
								synchronize: true,
								autoLoadEntities: true,
								uuidExtension: 'pgcrypto',
							}),
						}),
						UsersModule,
						AuthModule,
						KanbanModule,
					],
				},
			);
		});
	}
});

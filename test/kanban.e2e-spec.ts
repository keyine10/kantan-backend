import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KanbanModule } from '../src/kanban/kanban.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';

import * as request from 'supertest';
import { User } from '../src/users/entities/user.entity';

describe('Kanban e2e', () => {
	let app: INestApplication;
	let testAccount;
	let testAccountInstance;
	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				KanbanModule,
				UsersModule,
				AuthModule,
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
			],
		}).compile();
		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				transform: true,
				whitelist: true,
				forbidNonWhitelisted: true,
				transformOptions: {
					enableImplicitConversion: true,
				},
			}),
		);
		await app.init();
		testAccount = {
			name: 'testaccount',
			email: process.env.TEST_ACCOUNT_EMAIL,
			password: process.env.TEST_ACCOUNT_PASSWORD,
		};
	});
	describe('Authentication', () => {
		it('sign up', () => {
			return request(app.getHttpServer())
				.post('/authentication/sign-up')
				.send(testAccount)
				.expect(201)
				.then(({ body }) => {
					expect(body).toEqual({
						id: body.id,
						email: testAccount.email,
						name: testAccount.name,
					});
				});
		});
		it('sign in', () => {
			return request(app.getHttpServer())
				.post('/authentication/sign-in')
				.send({
					email: testAccount.email,
					password: testAccount.password,
				})
				.expect(200)
				.then(({ body }) => {
					expect(body).toEqual({
						...body,
						email: testAccount.email,
						name: testAccount.name,
					});
					expect(body.accessToken).toBeDefined();
					testAccountInstance = body;
				});
		});
	});
	afterAll(async () => {
		await request(app.getHttpServer())
			.delete(`/users/${testAccountInstance.id}`)
			.auth(testAccountInstance.accessToken, { type: 'bearer' })
			.send(testAccount)
			.expect(204)
			.then(async (res) => {
				let { body } = res;
				console.log(testAccountInstance);
				console.log(body);
			});
		await app.close();
	});
});

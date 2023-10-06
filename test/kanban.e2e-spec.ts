import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KanbanModule } from '../src/kanban/kanban.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';

import * as request from 'supertest';
import { User } from '../src/users/entities/user.entity';
import { before } from 'node:test';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { randomUUID } from 'crypto';

describe('Kanban End-to-end', () => {
	let app: INestApplication;
	let testAccount;
	let testAccountInstance;
	let testBoard;
	let testList;
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
		it('Sign up [POST authentication/sign-up]', async () => {
			return request(app.getHttpServer())
				.post('/authentication/sign-up')
				.send(testAccount)
				.expect(409);
			// .then(({ body }) => {
			// 	expect(body).toEqual({
			// 		id: body.id,
			// 		email: testAccount.email,
			// 		name: testAccount.name,
			// 	});
			// });
		});
		it('Sign in [POST authentication/sign-in]', () => {
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

	describe('Boards [/boards]', () => {
		describe('Create board [POST /boards]', () => {
			it('With title', () => {
				return request(app.getHttpServer())
					.post('/boards')
					.send({ title: 'new board' })
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(201)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							title: 'new board',
							creatorId: testAccountInstance.id,
						});
						testBoard = body;
					});
			});
			it('Without title', () => {
				return request(app.getHttpServer())
					.post('/boards')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(400);
			});
		});
		describe('Get boards [GET /boards]', () => {
			it('Get all boards [GET /boards]', () => {
				return request(app.getHttpServer())
					.get('/boards')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(200)
					.then(({ body }) => {
						expect(body.length).toBeGreaterThanOrEqual(1);
					});
			});
			it('Get board with id [GET /boards/:id]', () => {
				return request(app.getHttpServer())
					.get(`/boards/${testBoard.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(200);
			});
		});
		describe('Update board [PATCH /boards/:id]', () => {
			it('Update board with correct title', () => {
				return request(app.getHttpServer())
					.patch(`/boards/${testBoard.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						title: 'updated title',
						description: 'updated description',
					})
					.expect(200)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							title: 'updated title',
							description: 'updated description',
							id: testBoard.id,
						});
					});
			});
			it('Update board with empty title or description', () => {
				return request(app.getHttpServer())
					.patch(`/boards/${testBoard.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						title: '',
						description: '',
					})
					.expect(400);
			});

			it('Update board with incorrect id', () => {
				return request(app.getHttpServer())
					.patch(`/boards/${randomUUID()}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						title: 'updated board title',
						description: 'updated board description',
					})
					.expect(404);
			});
		});
		describe('Delete board [DELETE /boards/:id]', () => {
			it('Delete board with correct id', () => {
				return request(app.getHttpServer())
					.delete(`/boards/${testBoard.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(204);
			});

			it('Delete board with wrong id', () => {
				return request(app.getHttpServer())
					.delete(`/boards/${testBoard.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(204);
			});
		});
	});

	describe('Lists [/lists]', () => {
		//create a board to test lists
		beforeAll(async () => {
			await request(app.getHttpServer())
				.post('/boards')
				.send({ title: 'new board for lists' })
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.expect(201)
				.then(({ body }) => {
					expect(body).toEqual({
						...body,
						title: 'new board for lists',
						creatorId: testAccountInstance.id,
					});
					testBoard = body;
				});
		});
		describe('Create list [POST /lists]', () => {
			it('Create list with name, position, boardId', async () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'new list',
						position: 8192,
						boardId: testBoard.id,
					})
					.expect(201)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							name: 'new list',
							position: 8192,
							board: testBoard,
						});
						testList = body;
					});
			});
			it('Create list without name', () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						position: 8192,
						boardId: testBoard.id,
					})
					.expect(400);
			});
			it('Create list without position', () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'new list',
						boardId: testBoard.id,
					})
					.expect(400);
			});
			it('Create list without boardId', () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'new list',
						position: 8192,
					})
					.expect(400);
			});
			it('Create list with random uuid boardId', () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'new list',
						position: 8192,
						boardId: randomUUID(),
					})
					.expect(404);
			});
			it('Create list with wrong boardId type', () => {
				return request(app.getHttpServer())
					.post('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'new list',
						position: 8192,
						boardId: 123456,
					})
					.expect(400);
			});
		});
		describe('Get lists [GET /lists]', () => {
			it('Get all lists with correct boardId', () => {
				return request(app.getHttpServer())
					.get('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({ boardId: testBoard.id })
					.expect(200)
					.then(({ body }) => {
						expect(body.length).toBeGreaterThanOrEqual(1);
					});
			});
			it('Get all lists with incorrect boardId', () => {
				return request(app.getHttpServer())
					.get('/lists')
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({ boardId: randomUUID() })
					.expect(404);
			});
			it('Get list with listId [GET /lists/:id]', () => {
				return request(app.getHttpServer())
					.get(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(200)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							...testList,
						});
					});
			});
			it('Get list with wrong listId [GET /lists/:id]', () => {
				return request(app.getHttpServer())
					.get(`/lists/${randomUUID()}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.then(({ body }) => {
						expect(body.status).toEqual(404);
					});
			});
		});
		describe('Update list [PATCH /lists/:id]', () => {
			it('Update list with correct id', () => {
				return request(app.getHttpServer())
					.patch(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'updated list',
						position: 8192.25,
					})
					.expect(200)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							name: 'updated list',
							position: 8192.25,
							id: testList.id,
						});
					});
			});
			it('Update list with incorrect id', () => {
				return request(app.getHttpServer())
					.patch(`/lists/${randomUUID()}`)
					.auth(testAccountInstance.accessToken, {
						type: 'bearer',
					})
					.send({
						name: 'updated list',
						position: 8192.25,
					})
					.then(({ body }) => {
						expect(body.status).toEqual(404);
					});
			});
			it('Update list position', () => {
				return request(app.getHttpServer())
					.patch(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						position: 8192.25,
					})
					.expect(200)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							position: 8192.25,
							id: testList.id,
						});
					});
			});
			it('Update list name', () => {
				return request(app.getHttpServer())
					.patch(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.send({
						name: 'updated list',
					})
					.expect(200)
					.then(({ body }) => {
						expect(body).toEqual({
							...body,
							name: 'updated list',
							id: testList.id,
						});
					});
			});
		});
		describe('Delete list [DELETE /lists/:id]', () => {
			it('Delete list with correct id', () => {
				return request(app.getHttpServer())
					.delete(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(204);
			});
			it('Delete list with wrong id', () => {
				return request(app.getHttpServer())
					.delete(`/lists/${testList.id}`)
					.auth(testAccountInstance.accessToken, { type: 'bearer' })
					.expect(204);
			});
		});
		afterAll(async () => {
			//delete test board
			await request(app.getHttpServer())
				.delete(`/boards/${testBoard.id}`)
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.expect(204);
		});
	});

	describe('Tasks [/tasks]', () => {
		beforeAll(async () => {
			//create a board and a list to test tasks
			await request(app.getHttpServer())
				.post('/boards')
				.send({ title: 'new board for tasks' })
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.expect(201)
				.then(({ body }) => {
					expect(body).toEqual({
						...body,
						title: 'new board for tasks',
						creatorId: testAccountInstance.id,
					});
					testBoard = body;
				});

			await request(app.getHttpServer())
				.post('/lists')
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.send({
					name: 'new list for tasks',
					position: 8192,
					boardId: testBoard.id,
				})
				.expect(201)
				.then(({ body }) => {
					expect(body).toEqual({
						...body,
						name: 'new list for tasks',
						position: 8192,
						board: testBoard,
					});
					testList = body;
				});
		});

		it('Create task [POST /tasks]', () => {
			return request(app.getHttpServer())
				.post(`/tasks`)
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.send({
					name: 'new task',
					position: 8192,
					listId: testList.id,
				})
				.expect(201)
				.then(({ body }) => {
					let receivedTask = {
						name: body.name,
						position: body.position,
						listId: body.listId,
					};
					expect(receivedTask).toEqual({
						name: 'new task',
						position: 8192,
						listId: testList.id,
					})
				});
		});

		afterAll(async () => {
			//delete test board
			await request(app.getHttpServer())
				.delete(`/boards/${testBoard.id}`)
				.auth(testAccountInstance.accessToken, { type: 'bearer' })
				.expect(204);
		});
	});

	afterAll(async () => {
		// delete test account
		// await request(app.getHttpServer())
		// 	.delete(`/users/${testAccountInstance.id}`)
		// 	.auth(testAccountInstance.accessToken, { type: 'bearer' })
		// 	.send(testAccount)
		// 	.expect(204);
		await app.close();
	});
});

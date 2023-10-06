import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	//logging body of request
	morgan.token('body', (req) => {
		return JSON.stringify(req.body);
	});
	app.use(morgan(':method :url :status :body'));
	app.enableCors();

	// validation pipe for dtos
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

	const options = new DocumentBuilder()
		.setTitle('Kantan API')
		.setDescription('Kanban Board application')
		.setVersion('0.0.1')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api', app, document);

	await app.listen(3001);
	console.log('Application is running on: http://localhost:3001');
	console.log('Swagger UI is running on: http://localhost:3001/api');
}
bootstrap();

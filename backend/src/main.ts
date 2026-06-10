import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi DTO global + buang field tak dikenal
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Format error seragam
  app.useGlobalFilters(new AllExceptionsFilter());

  // Prefix versi API
  app.setGlobalPrefix('api/v1');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CRM Cafe API')
    .setDescription('Loyalty & promo terintegrasi POS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const port = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`🚀 API: http://localhost:${port}/api/v1`);
  console.log(`📚 Docs: http://localhost:${port}/docs`);
}
bootstrap();

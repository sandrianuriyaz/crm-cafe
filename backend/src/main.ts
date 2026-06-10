import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // rawBody: true → req.rawBody (Buffer) tersedia untuk verifikasi HMAC webhook POS
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // CORS — izinkan frontend (Next.js) memanggil API. Pakai Bearer token (bukan
  // cookie), origin:true memantulkan origin pemanggil. Batasi di production.
  app.enableCors({ origin: true });

  // Validasi DTO global + buang field tak dikenal
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Format error seragam
  app.useGlobalFilters(new AllExceptionsFilter());

  // Prefix versi API. Webhook POS dikecualikan agar path persis sesuai kontrak
  // §4: POST /webhooks/pos/transactions (tanpa /api/v1).
  app.setGlobalPrefix('api/v1', {
    exclude: ['webhooks/pos/transactions'],
  });

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

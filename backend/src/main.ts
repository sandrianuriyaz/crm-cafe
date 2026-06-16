import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // rawBody: true → req.rawBody (Buffer) tersedia untuk verifikasi HMAC webhook POS
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  // CORS — izinkan frontend (Next.js) memanggil API. Pakai Bearer token (bukan
  // cookie). Production: set CORS_ORIGIN (pisah koma); kosong = izinkan semua (dev).
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((o) => o.trim())
      : true,
  });

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
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CRM Cafe API')
    .setDescription('Loyalty & promo terintegrasi POS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  // 0.0.0.0 supaya bisa diakses dari luar container (host deploy).
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API listening on port ${port} (prefix /api/v1)`);
}
bootstrap();

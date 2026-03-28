import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '').toLowerCase();
  const frontendUrl = normalizeOrigin(process.env.APP_URL || '');

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }

  // Security headers
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const helmet = require('helmet');
  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      const incoming = normalizeOrigin(origin);
      const isAllowed = allowedOrigins.includes(incoming);
      callback(isAllowed ? null : new Error('CORS origin not allowed'), isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}

bootstrap();


import 'reflect-metadata';
import { join } from 'path';
import { existsSync } from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { prepareDatabase, stopDatabase } from './mongo/database';

async function bootstrap(): Promise<void> {
  await prepareDatabase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({ origin: ['http://localhost:4200', 'http://127.0.0.1:4200'] });

  const candidates = [
    join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser'),
    join(__dirname, '..', '..', 'frontend', 'dist', 'frontend'),
  ];
  const webRoot = candidates.find((dir) => existsSync(join(dir, 'index.html')));
  if (webRoot) {
    app.useStaticAssets(webRoot, { index: false });
    app.use((req: any, res: any, next: () => void) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(join(webRoot, 'index.html'));
      }
      next();
    });
    console.log(`Web interface: ${webRoot}`);
  } else {
    console.warn('Web interface not built yet. Run "ng build" inside frontend/.');
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);

  const shutdown = async () => {
    await app.close();
    await stopDatabase();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();

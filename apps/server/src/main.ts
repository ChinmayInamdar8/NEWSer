import "./load-env";
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const webOrigin =
    config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
  const adminOrigin =
    config.get<string>('ADMIN_ORIGIN') ?? 'http://localhost:3001';

  app.use(cookieParser());
  app.enableCors({
    origin: [webOrigin, adminOrigin],
    credentials: true,
  });

  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const webOrigin =
    config.getOrThrow<string>('WEB_ORIGIN') ;
  const adminOrigin =
    config.getOrThrow<string>('ADMIN_ORIGIN') ;

  app.use(cookieParser());
  app.enableCors({
    origin: [webOrigin, adminOrigin],
    credentials: true,
  });

  const port = Number(config.getOrThrow('PORT'));
  await app.listen(port);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cors from "cors";
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  //////////// CORS /////////////


  ///////// GLOBAL ///////////
  app.useGlobalPipes( new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))



  ////////// USE ///////////////
  app.use( cors() );
  app.use( json({ limit: '10mb' }) );
  app.use( urlencoded({ extended: true, limit: '10mb' }) );
  app.set('trust proxy', 'loopback');


  //// SWAGGER / SCALAR ////////
  const config = new DocumentBuilder()
    .setTitle('Libero Web - API')
    .addBearerAuth()
    .setDescription('Documentacion basica sobre el uso de esta API')
    .setVersion('0.1')
    .addCookieAuth()
    .build()

  
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);


  app.use(
    '/scalar',
    apiReference({
      content: document,
      theme: 'purple',
      darkMode: true
    })
  )



  ////////////// LISTEN ////////////

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

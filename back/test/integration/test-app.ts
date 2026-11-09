import { ClassSerializerInterceptor, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createConnection } from 'mysql2/promise';

import { AppModule } from '../../src/app.module';
import { DatabaseModule } from '../../src/database/database.module';
import { FacebookService } from '../../src/modules/facebook/facebook.service';

/**
 * Base de datos exclusiva para las pruebas de integración.
 * Usa el mismo servidor MySQL del archivo .env, pero una base de datos aparte
 * (por defecto "libero_test") que se borra y se vuelve a crear en cada ejecución,
 * para no tocar los datos reales del proyecto.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = process.env.TEST_DB_HOST ?? config.get<string>('DB_HOST') ?? 'localhost';
        const port = Number(process.env.TEST_DB_PORT ?? config.get<number>('DB_PORT') ?? 3306);
        const username = process.env.TEST_DB_USER ?? config.get<string>('DB_USER');
        const password = process.env.TEST_DB_PASSWORD ?? config.get<string>('DB_PASSWORD');
        const database = process.env.TEST_DB_DATABASE ?? 'libero_test';

        // Crea la base de datos de pruebas si todavía no existe
        const conn = await createConnection({ host, port, user: username, password });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await conn.end();

        return {
          type: 'mysql' as const,
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
          logging: false,
        };
      },
    }),
  ],
})
class TestDatabaseModule {}

/**
 * Levanta la aplicación completa (todos los módulos, guards, pipes e interceptores
 * igual que en main.ts) conectada a la base de datos de pruebas.
 */
export async function createTestApp(): Promise<INestApplication> {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-de-pruebas';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule)
    // El scraper de Facebook abre un navegador en segundo plano; no hace parte de estas pruebas.
    .overrideProvider(FacebookService)
    .useValue({})
    .compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();
  return app;
}

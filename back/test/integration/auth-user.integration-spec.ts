import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp } from './test-app';
import { UserEntity } from '../../src/modules/user/entities/user.entity';

/**
 * PRUEBA DE INTEGRACIÓN 1
 * Registro, inicio de sesión y consulta del perfil.
 *
 * Recorre juntos: AuthController -> AuthService -> UserService -> RolService
 * -> base de datos MySQL -> JWT -> JwtAuthGuard -> perfil.
 */
describe('Integración 1: registro, inicio de sesión y perfil de usuario', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const nuevoUsuario = {
    username: 'stiven_pruebas',
    email: 'stiven.pruebas@libero.com',
    password: 'ClaveSegura123',
  };

  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1) registra un usuario nuevo y lo guarda en la base de datos con la contraseña cifrada', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(nuevoUsuario)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(nuevoUsuario.email);
    // La contraseña nunca debe viajar de regreso al cliente
    expect(res.body.data.password).toBeUndefined();

    const guardado = await dataSource.getRepository(UserEntity).findOne({
      where: { email: nuevoUsuario.email },
      relations: { rol: true },
    });

    expect(guardado).not.toBeNull();
    expect(guardado!.name).toBe(nuevoUsuario.username);
    expect(guardado!.password).not.toBe(nuevoUsuario.password);
    expect(guardado!.rol?.name).toBe('user');
  });

  it('2) no permite registrar dos veces el mismo correo', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...nuevoUsuario, username: 'otro_nombre' })
      .expect(409);
  });

  it('3) inicia sesión con el usuario registrado y entrega un token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: nuevoUsuario.email, password: nuevoUsuario.password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.user.username).toBe(nuevoUsuario.username);
    expect(res.body.data.user.role).toBe('user');

    token = res.body.data.accessToken;
  });

  it('4) rechaza el inicio de sesión con una contraseña equivocada', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: nuevoUsuario.email, password: 'ClaveIncorrecta' })
      .expect(401);
  });

  it('5) con el token entrega el perfil, y sin token lo bloquea', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.username).toBe(nuevoUsuario.username);
    expect(res.body.email).toBe(nuevoUsuario.email);

    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  });
});

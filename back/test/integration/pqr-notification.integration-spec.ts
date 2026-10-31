import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './test-app';

/**
 * PRUEBA DE INTEGRACIÓN 2
 * Envío de una PQR por un usuario, respuesta del administrador y aviso en la campana.
 *
 * Recorre juntos: Auth + User + PQR + Notification + RolesGuard + base de datos MySQL.
 * Usa el administrador que crea automáticamente el seeder (admin@libero.com).
 */
describe('Integración 2: PQR del usuario, respuesta del administrador y notificación', () => {
  let app: INestApplication;

  let tokenUsuario: string;
  let tokenAdmin: string;
  let pqrUuid: string;

  const usuario = {
    username: 'vecino_pruebas',
    email: 'vecino.pruebas@libero.com',
    password: 'ClaveVecino123',
  };

  const pqr = {
    type: 'queja',
    subject: 'Ruido en horario nocturno',
    message: 'Desde hace varios días hay ruido fuerte después de las diez de la noche.',
  };

  beforeAll(async () => {
    app = await createTestApp();
    const http = app.getHttpServer();

    await request(http).post('/auth/register').send(usuario).expect(201);

    const loginUsuario = await request(http)
      .post('/auth/login')
      .send({ identifier: usuario.email, password: usuario.password })
      .expect(201);
    tokenUsuario = loginUsuario.body.data.accessToken;

    const loginAdmin = await request(http)
      .post('/auth/login')
      .send({ identifier: 'admin@libero.com', password: 'Admin123!' })
      .expect(201);
    tokenAdmin = loginAdmin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1) el usuario envía una PQR y queda pendiente y ligada a su cuenta', async () => {
    const res = await request(app.getHttpServer())
      .post('/pqrs')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(pqr)
      .expect(201);

    expect(res.body.status).toBe('pendiente');
    expect(res.body.fullName).toBe(usuario.username);
    expect(res.body.email).toBe(usuario.email);
    pqrUuid = res.body.uuid;
  });

  it('2) un usuario normal no puede ver el panel de PQRs', async () => {
    await request(app.getHttpServer())
      .get('/pqrs')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .expect(403);
  });

  it('3) el administrador ve la PQR en el panel', async () => {
    const res = await request(app.getHttpServer())
      .get('/pqrs')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const encontrada = res.body.data.find((p: any) => p.uuid === pqrUuid);
    expect(encontrada).toBeDefined();
    expect(encontrada.subject).toBe(pqr.subject);
  });

  it('4) el administrador responde y marca la PQR como resuelta', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/pqrs/${pqrUuid}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'resuelto', response: 'Ya hablamos con los responsables del ruido.' })
      .expect(200);

    expect(res.body.status).toBe('resuelto');
    expect(res.body.response).toContain('responsables');
    expect(res.body.respondedAt).toBeTruthy();
  });

  it('5) al usuario le llega el aviso de la respuesta en su campana de notificaciones', async () => {
    const conteo = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .expect(200);
    expect(conteo.body.count).toBeGreaterThanOrEqual(1);

    const lista = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .expect(200);

    const items = Array.isArray(lista.body) ? lista.body : lista.body.data;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(items)).toContain(pqrUuid);
  });
});

export type PqrType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
export type PqrStatus = 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado';

export interface Pqr {
  uuid: string;
  fullName: string;
  email: string;
  phone: string | null;
  type: PqrType;
  subject: string;
  message: string;
  status: PqrStatus;
  response: string | null;
  respondedAt: Date | null;
  createdAt: Date;
}
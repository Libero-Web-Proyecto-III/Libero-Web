export interface AuthUser {
  id: number;
  uuid?: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}
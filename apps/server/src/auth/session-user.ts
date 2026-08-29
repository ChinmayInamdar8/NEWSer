import type { UserRole, UserStatus } from '@workspace/db';
import type { SessionUser } from '@workspace/types';

export type SessionUserRecord = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
};

export function toSessionUser(user: SessionUserRecord): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

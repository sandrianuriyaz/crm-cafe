import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Batasi route ke role tertentu, mis. @Roles('ADMIN'). Pakai bareng RolesGuard.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

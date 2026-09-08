import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GetUsers } from './get-users.use-case.js';
import { UserEntity } from '../../entities/user.entity.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';


test('GetUsers delegates straight to the repository', async () => {
  const users = [new UserEntity('1', 'Andres', 'andres@example.com', 'hashed-password', ['USER_ROLE'])];

  const authRepository: AuthRepository = {
    getUsers: async () => users,
    login: async () => { throw new Error('not used in this test'); },
    register: async () => { throw new Error('not used in this test'); },
    findById: async () => { throw new Error('not used in this test'); },
  };

  const result = await new GetUsers( authRepository ).execute();

  assert.equal(result, users);
});

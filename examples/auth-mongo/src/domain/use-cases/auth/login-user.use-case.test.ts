import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginUser } from './login-user.use-case.js';
import { LoginUserDto } from '../../dtos/auth/login-user.dto.js';
import { UserEntity } from '../../entities/user.entity.js';
import { CustomError } from '../../errors/custom.error.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';


test('LoginUser returns a token and a public user without the password', async () => {
  const [, dto] = LoginUserDto.login({ email: 'andres@example.com', password: '123456' });
  const user = new UserEntity('1', 'Andres', 'andres@example.com', 'hashed-password', ['USER_ROLE']);

  const authRepository: AuthRepository = {
    login: async () => user,
    register: async () => { throw new Error('not used in this test'); },
    getUsers: async () => [user],
    findById: async () => user,
  };

  const useCase = new LoginUser( authRepository, async () => 'signed-token' );
  const result = await useCase.execute( dto! );

  assert.equal(result.token, 'signed-token');
  assert.deepEqual(result.user, { id: '1', name: 'Andres', email: 'andres@example.com' });
});

test('LoginUser propagates invalid-credentials errors from the repository', async () => {
  const [, dto] = LoginUserDto.login({ email: 'andres@example.com', password: '123456' });

  const authRepository: AuthRepository = {
    login: async () => { throw CustomError.unauthorized('Invalid password'); },
    register: async () => { throw new Error('not used in this test'); },
    getUsers: async () => [],
    findById: async () => { throw new Error('not used in this test'); },
  };

  const useCase = new LoginUser( authRepository, async () => 'signed-token' );

  await assert.rejects(
    () => useCase.execute( dto! ),
    (error: unknown) => error instanceof CustomError && error.statusCode === 401,
  );
});

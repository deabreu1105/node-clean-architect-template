import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterUser } from './register-user.use-case.js';
import { RegisterUserDto } from '../../dtos/auth/register-user.dto.js';
import { UserEntity } from '../../entities/user.entity.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';


const fakeRepository = ( registeredUser: UserEntity ): AuthRepository => ({
  register: async () => registeredUser,
  login: async () => { throw new Error('not used in this test'); },
  getUsers: async () => [registeredUser],
  findById: async () => registeredUser,
});


test('RegisterUser returns a token and a public user without the password', async () => {
  const [, dto] = RegisterUserDto.create({ name: 'Andres', email: 'andres@example.com', password: '123456' });
  const user = new UserEntity('1', 'Andres', 'andres@example.com', 'hashed-password', ['USER_ROLE']);

  const useCase = new RegisterUser( fakeRepository(user), async () => 'signed-token' );
  const result = await useCase.execute( dto! );

  assert.equal(result.token, 'signed-token');
  assert.deepEqual(result.user, { id: '1', name: 'Andres', email: 'andres@example.com' });
  assert.equal(Object.hasOwn(result.user, 'password'), false);
});

test('RegisterUser throws when token signing fails', async () => {
  const [, dto] = RegisterUserDto.create({ name: 'Andres', email: 'andres@example.com', password: '123456' });
  const user = new UserEntity('1', 'Andres', 'andres@example.com', 'hashed-password', ['USER_ROLE']);

  const useCase = new RegisterUser( fakeRepository(user), async () => null );

  await assert.rejects(() => useCase.execute( dto! ));
});

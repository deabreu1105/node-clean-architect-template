import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginUserDto } from './login-user.dto.js';


test('LoginUserDto.login requires an email', () => {
  const [error, dto] = LoginUserDto.login({ password: '123456' });
  assert.equal(error, 'Email is required');
  assert.equal(dto, undefined);
});

test('LoginUserDto.login requires a valid email', () => {
  const [error] = LoginUserDto.login({ email: 'not-an-email', password: '123456' });
  assert.equal(error, 'Email is invalid');
});

test('LoginUserDto.login requires a password', () => {
  const [error] = LoginUserDto.login({ email: 'a@a.com' });
  assert.equal(error, 'Password is required');
});

test('LoginUserDto.login succeeds with valid data', () => {
  const [error, dto] = LoginUserDto.login({ email: 'a@a.com', password: '123456' });
  assert.equal(error, '');
  assert.equal(dto?.email, 'a@a.com');
  assert.equal(dto?.password, '123456');
});

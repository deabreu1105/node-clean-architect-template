import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterUserDto } from './register-user.dto.js';


test('RegisterUserDto.create requires a name', () => {
  const [error, dto] = RegisterUserDto.create({ email: 'a@a.com', password: '123456' });
  assert.equal(error, 'Name is required');
  assert.equal(dto, undefined);
});

test('RegisterUserDto.create requires a valid email', () => {
  const [error] = RegisterUserDto.create({ name: 'Andres', email: 'not-an-email', password: '123456' });
  assert.equal(error, 'Email is invalid');
});

test('RegisterUserDto.create requires a password of at least 6 characters', () => {
  const [error] = RegisterUserDto.create({ name: 'Andres', email: 'a@a.com', password: '123' });
  assert.equal(error, 'Password must be at least 6 characters long');
});

test('RegisterUserDto.create normalizes the email to lowercase', () => {
  const [error, dto] = RegisterUserDto.create({ name: 'Andres', email: 'ANDRES@Example.COM', password: '123456' });
  assert.equal(error, '');
  assert.equal(dto?.email, 'andres@example.com');
  assert.equal(dto?.name, 'Andres');
});

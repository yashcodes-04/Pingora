import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { HeyGenService } from '../dist/services/heygen.service.js';
import { presence } from '../dist/socket/presence.js';
import { AuthService } from '../dist/services/auth.service.js';

test('AuthService generates valid signed JWT token', () => {
  const dummyUser = {
    id: 'user-1234',
    username: 'alex_test',
    role: 'USER'
  };

  const token = AuthService.generateToken(dummyUser);
  assert.ok(typeof token === 'string' && token.length > 20, 'Token should be a non-empty string');

  const decoded = jwt.decode(token);
  assert.equal(decoded.id, dummyUser.id);
  assert.equal(decoded.username, dummyUser.username);
  assert.equal(decoded.role, dummyUser.role);
});

test('HeyGenService lists curated AI avatars when no API key is set', async () => {
  const result = await HeyGenService.listAvatars();
  assert.ok(result.avatars.length >= 3, 'Should provide at least 3 AI avatars in catalog');
  assert.ok(result.avatars[0].avatar_id, 'Avatar should have an avatar_id');
  assert.ok(result.avatars[0].preview_image_url, 'Avatar should have a preview_image_url');
});

test('HeyGenService custom avatar generation / fallback works seamlessly', async () => {
  const generated = await HeyGenService.generateCustomAvatar({
    avatarId: 'heygen_ava_alex_tech',
    avatarName: 'Alex Vance'
  });
  assert.equal(generated.avatarId, 'heygen_ava_alex_tech');
  assert.ok(generated.avatarUrl.includes('http'), 'Avatar URL should be a valid web URL');
  assert.equal(generated.status, 'ready');
});

test('PresenceManager handles socket lifecycle and user online/offline transitions', async () => {
  const userId = 'user-test-777';
  const socket1 = 'socket-tab-1';
  const socket2 = 'socket-tab-2';

  // Initially offline
  assert.equal(presence.isUserOnline(userId), false);

  // Tab 1 connects -> becomes online
  const firstOnline = presence.addUserSocket(userId, socket1);
  assert.equal(firstOnline, true, 'User should transition to online on first socket');
  assert.equal(presence.isUserOnline(userId), true);

  // Tab 2 connects -> stays online
  const secondOnline = presence.addUserSocket(userId, socket2);
  assert.equal(secondOnline, false, 'User was already online');
  assert.equal(presence.getUserSockets(userId).length, 2);

  // Tab 1 closes -> still online because of tab 2
  const close1 = await presence.removeSocket(socket1);
  assert.equal(close1.becameOffline, false);
  assert.equal(presence.isUserOnline(userId), true);

  // Tab 2 closes -> becomes offline
  const close2 = await presence.removeSocket(socket2);
  assert.equal(close2.becameOffline, true, 'User should transition to offline when last socket closes');
  assert.equal(presence.isUserOnline(userId), false);
});


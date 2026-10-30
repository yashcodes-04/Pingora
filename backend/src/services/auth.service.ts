import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export class AuthService {
  static async register(data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
    role?: Role;
  }) {
    const cleanUsername = data.username.toLowerCase().trim();
    const cleanEmail = data.email.toLowerCase().trim();

    // Check if username or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }]
      }
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        throw new Error('Username is already taken');
      }
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        displayName: data.displayName || data.username,
        avatarUrl: data.avatarUrl || null,
        role: data.role || 'USER'
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true
      }
    });

    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(identifier: string, password: string) {
    const cleanIdentifier = identifier.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanIdentifier }, { email: cleanIdentifier }]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isBanned) {
      throw new Error('Account has been suspended by an administrator');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() }
    });

    const token = this.generateToken(user);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      heygenAvatarId: user.heygenAvatarId,
      bio: user.bio,
      role: user.role,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt
    };

    return { user: safeUser, token };
  }

  static generateToken(user: { id: string; username: string; role: Role }): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}


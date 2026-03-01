import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import clinicRepository from '../repositories/clinic.repository';
import userRepository from '../repositories/user.repository';
import { sessionStore } from '../utils/redis';

const SESSION_TTL = parseInt(process.env.SESSION_TTL || '604800', 10);

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId: string;
  permissions: string[];
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const clinic = await clinicRepository.create({
      name: data.clinicName,
      address: data.clinicAddress,
      phone: data.clinicPhone,
    });

    const user = await userRepository.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'DOCTOR',
      clinicId: clinic.id,
    });

    const token = await this.createSession(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId,
        permissions: user.permissions || [],
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await userRepository.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = await this.createSession(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId,
        permissions: user.permissions || [],
      },
      token,
    };
  }

  async logout(token: string) {
    await sessionStore.destroy(token);
  }

  async validateSession(token: string): Promise<SessionUser | null> {
    const sessionData = await sessionStore.get(token);
    if (!sessionData) {
      return null;
    }
    
    try {
      const user = JSON.parse(sessionData) as SessionUser;
      await sessionStore.touch(token, SESSION_TTL);
      return user;
    } catch {
      return null;
    }
  }

  private async createSession(user: { id: string; email: string; firstName: string; lastName: string; role: string; clinicId: string; permissions?: string[] }) {
    const token = uuidv4();
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clinicId: user.clinicId,
      permissions: user.permissions || [],
    };
    
    await sessionStore.set(token, JSON.stringify(sessionUser), SESSION_TTL);
    return token;
  }

  async createUser(clinicId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'DOCTOR' | 'STAFF';
  }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    return userRepository.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      clinicId,
    });
  }
}

export default new AuthService();

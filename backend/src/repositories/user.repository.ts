import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

export class UserRepository {
  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'DOCTOR' | 'STAFF';
    clinicId: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByClinic(clinicId: string) {
    return prisma.user.findMany({ 
      where: { clinicId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    role?: 'DOCTOR' | 'STAFF';
  }) {
    return prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  }

  async delete(id: string) {
    return prisma.user.updateMany({ where: { id }, data: { deletedAt: new Date() } });
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

export default new UserRepository();

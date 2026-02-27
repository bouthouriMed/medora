import prisma from '../utils/prisma';

export class ClinicRepository {
  async create(data: { name: string; address?: string; phone?: string; email?: string }) {
    return prisma.clinic.create({ data });
  }

  async findById(id: string) {
    return prisma.clinic.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.clinic.findUnique({ where: { email } });
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string; email?: string }) {
    return prisma.clinic.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.clinic.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export default new ClinicRepository();

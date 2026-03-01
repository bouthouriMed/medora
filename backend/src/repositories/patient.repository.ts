import prisma from '../utils/prisma';

function generatePortalToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

export class PatientRepository {
  async create(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    notes?: string;
    clinicId: string;
  }) {
    return prisma.patient.create({ 
      data: { 
        ...data, 
        portalToken: generatePortalToken() 
      } 
    });
  }

  async findById(id: string, clinicId: string) {
    return prisma.patient.findFirst({ where: { id, clinicId, deletedAt: null } });
  }

  async findByClinic(clinicId: string, search?: string) {
    const where: Record<string, unknown> = { clinicId, deletedAt: null };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.patient.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' },
      include: { patientTags: { include: { tag: true } } },
    });
  }

  async findByPortalToken(token: string) {
    return prisma.patient.findFirst({
      where: { portalToken: token, deletedAt: null },
      include: {
        clinic: true,
        appointments: {
          orderBy: { dateTime: 'desc' },
          include: {
            doctor: { select: { firstName: true, lastName: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            appointment: true,
          },
        },
      },
    });
  }

  async regeneratePortalToken(id: string, clinicId: string) {
    return prisma.patient.updateMany({
      where: { id, clinicId },
      data: { portalToken: generatePortalToken() },
    });
  }

  async update(id: string, clinicId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    notes?: string;
  }) {
    return prisma.patient.updateMany({
      where: { id, clinicId },
      data,
    });
  }

  async delete(id: string, clinicId: string) {
    return prisma.patient.updateMany({
      where: { id, clinicId },
      data: { deletedAt: new Date() },
    });
  }
}

export default new PatientRepository();

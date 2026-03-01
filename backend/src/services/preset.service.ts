import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PresetType = 'DIAGNOSIS' | 'PRESCRIPTION' | 'PROCEDURE';

export interface CreatePresetInput {
  name: string;
  type: PresetType;
  description?: string;
  price?: number;
}

class PresetService {
  async create(clinicId: string, data: CreatePresetInput) {
    return prisma.preset.create({
      data: {
        ...data,
        clinicId,
      },
    });
  }

  async createBulk(clinicId: string, presets: CreatePresetInput[]) {
    const data = presets.map((preset) => ({
      ...preset,
      clinicId,
    }));
    return prisma.preset.createMany({
      data,
    });
  }

  async getAll(clinicId: string, type?: PresetType) {
    const where: any = { clinicId };
    if (type) {
      where.type = type;
    }
    return prisma.preset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, clinicId: string) {
    return prisma.preset.findFirst({
      where: { id, clinicId },
    });
  }

  async delete(id: string, clinicId: string) {
    return prisma.preset.delete({
      where: { id },
    });
  }
}

export default new PresetService();

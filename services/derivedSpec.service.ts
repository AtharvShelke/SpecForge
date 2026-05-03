import { prisma } from '@/lib/prisma';

export interface CreateDerivedSpecInput {
  name: string;
  description?: string;
  resultSpecId: string;
  formula: string;
  formulaType?: 'AGGREGATION' | 'CALCULATION' | 'CONDITIONAL' | 'REFERENCE';
  inputSpecIds?: string[];
  enabled?: boolean;
}

export const derivedSpecService = {
  async getAll() {
    return await prisma.derivedSpec.findMany({
      include: { resultSpec: true },
      orderBy: { name: 'asc' }
    });
  },

  async getById(id: string) {
    return await prisma.derivedSpec.findUnique({
      where: { id },
      include: { resultSpec: true }
    });
  },

  async create(data: CreateDerivedSpecInput) {
    return await prisma.derivedSpec.create({
      data: {
        ...data,
        inputSpecIds: data.inputSpecIds || [],
        formulaType: data.formulaType || 'AGGREGATION',
        enabled: data.enabled !== undefined ? data.enabled : true,
      },
      include: { resultSpec: true }
    });
  },

  async update(id: string, data: Partial<CreateDerivedSpecInput>) {
    return await prisma.derivedSpec.update({
      where: { id },
      data: {
        ...data,
        inputSpecIds: data.inputSpecIds !== undefined ? data.inputSpecIds : undefined,
      },
      include: { resultSpec: true }
    });
  },

  async delete(id: string) {
    return await prisma.derivedSpec.delete({
      where: { id }
    });
  },

  async evaluateForBuild(buildId: string) {
    const derivedSpecs = await prisma.derivedSpec.findMany({
      where: { enabled: true },
      include: { resultSpec: true }
    });

    const results: Record<string, any> = {};

    for (const spec of derivedSpecs) {
      const value = await evaluateFormula(spec.formula, buildId);
      results[spec.name] = value;
    }

    return results;
  }
};

// Export named functions for API routes
export const listDerivedSpecs = derivedSpecService.getAll;
export const getDerivedSpecById = derivedSpecService.getById;
export const createDerivedSpec = derivedSpecService.create;
export const updateDerivedSpec = derivedSpecService.update;
export const deleteDerivedSpec = derivedSpecService.delete;

async function evaluateFormula(formula: string, buildId: string): Promise<any> {
  // Parse formula and evaluate
  // This is a simplified version - in production, use a proper expression parser
  const parts = formula.match(/(\w+)\(([^)]+)\)/);
  if (!parts) return null;

  const [, func, args] = parts;
  const argList = args.split(',').map((a: string) => a.trim());

  switch (func.toUpperCase()) {
    case 'SUM':
      return argList.reduce((sum: number, arg: string) => sum + (parseFloat(arg) || 0), 0);
    case 'SUBTRACT':
      return argList.length >= 2 ? parseFloat(argList[0]) - parseFloat(argList[1]) : 0;
    case 'MULTIPLY':
      return argList.reduce((product: number, arg: string) => product * (parseFloat(arg) || 1), 1);
    case 'DIVIDE':
      return argList.length >= 2 && parseFloat(argList[1]) !== 0
        ? parseFloat(argList[0]) / parseFloat(argList[1])
        : 0;
    default:
      return null;
  }
}

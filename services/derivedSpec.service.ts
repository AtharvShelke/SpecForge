export interface CreateDerivedSpecInput {
  id?: string;
  name: string;
  description?: string;
  resultSpecId: string;
  formula: string;
  formulaType?: 'AGGREGATION' | 'CALCULATION' | 'CONDITIONAL' | 'REFERENCE';
  inputSpecIds?: string[];
  enabled?: boolean;
}

let inMemoryDerivedSpecs: any[] = [];

export const derivedSpecService = {
  async getAll() {
    return inMemoryDerivedSpecs;
  },

  async getById(id: string) {
    return inMemoryDerivedSpecs.find(s => s.id === id) || null;
  },

  async create(data: CreateDerivedSpecInput) {
    const newSpec = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      inputSpecIds: data.inputSpecIds || [],
      formulaType: data.formulaType || 'AGGREGATION',
      enabled: data.enabled !== undefined ? data.enabled : true,
      resultSpec: { id: data.resultSpecId, name: 'Mock Result Spec' }
    };
    inMemoryDerivedSpecs.push(newSpec);
    return newSpec;
  },

  async update(id: string, data: Partial<CreateDerivedSpecInput>) {
    const idx = inMemoryDerivedSpecs.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Not found");
    const updated = {
      ...inMemoryDerivedSpecs[idx],
      ...data,
      inputSpecIds: data.inputSpecIds !== undefined ? data.inputSpecIds : inMemoryDerivedSpecs[idx].inputSpecIds,
    };
    inMemoryDerivedSpecs[idx] = updated;
    return updated;
  },

  async delete(id: string) {
    const idx = inMemoryDerivedSpecs.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Not found");
    const deleted = inMemoryDerivedSpecs[idx];
    inMemoryDerivedSpecs = inMemoryDerivedSpecs.filter(s => s.id !== id);
    return deleted;
  },

  async evaluateForBuild(buildId: string) {
    const results: Record<string, any> = {};
    for (const spec of inMemoryDerivedSpecs) {
      if (!spec.enabled) continue;
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


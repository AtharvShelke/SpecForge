import { prisma } from '@/lib/prisma';

export const categoryService = {
  async getAll() {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async getById(id: string) {
    return await prisma.category.findUnique({
      where: { id }
    });
  },

  async getCategoryNames() {
    const categories = await this.getAll();
    return categories.reduce((acc, cat) => {
      const slug = cat.name.toUpperCase().replace(/\s+/g, '_');
      acc[slug] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  },

  async getCategoryLabels() {
    const categories = await this.getAll();
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }
};

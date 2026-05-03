import { prisma } from '@/lib/prisma';

export const configService = {
  async getTaxRate(country: string = 'India') {
    const tax = await prisma.taxSettings.findFirst({
      where: { enabled: true }
    });
    return tax ? Number(tax.taxRatePct) : 18; // fallback to 18%
  },

  async getPaymentMethods() {
    return await prisma.paymentMethod.findMany({
      where: { enabled: true },
      orderBy: { label: 'asc' }
    });
  },

  async getSetting(key: string) {
    const setting = await prisma.appSettings.findUnique({
      where: { key }
    });
    return setting?.value;
  },

  async setSetting(key: string, value: string) {
    return await prisma.appSettings.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  },

  async getDefaultCountry() {
    return await this.getSetting('default_country') || 'India';
  },

  async getDefaultCurrency() {
    return await this.getSetting('default_currency') || 'INR';
  }
};

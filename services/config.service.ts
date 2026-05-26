const inMemorySettings = new Map<string, string>();

export const configService = {
  async getTaxRate(country: string = 'India') {
    return 18; // fallback to 18%
  },

  async getPaymentMethods() {
    return [
      { id: 'upi', key: 'UPI', label: 'UPI', enabled: true },
      { id: 'bank_transfer', key: 'BANK_TRANSFER', label: 'Bank Transfer', enabled: true },
      { id: 'razorpay', key: 'RAZORPAY', label: 'Razorpay', enabled: true },
    ];
  },

  async getSetting(key: string) {
    return inMemorySettings.get(key);
  },

  async setSetting(key: string, value: string) {
    inMemorySettings.set(key, value);
    return { key, value };
  },

  async getDefaultCountry() {
    return await this.getSetting('default_country') || 'India';
  },

  async getDefaultCurrency() {
    return await this.getSetting('default_currency') || 'INR';
  }
};


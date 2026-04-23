
import { CATEGORY_NAMES } from '../lib/categoryUtils';

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
  // Filter logic
  category?: string;
  brand?: string;
  query?: string; // Matches against product name or specs
  subCategoryId?: string;
  isOpen?: boolean; // Initial UI state
}

export const BUILD_SEQUENCE = [
  CATEGORY_NAMES.PROCESSOR,
  CATEGORY_NAMES.MOTHERBOARD,
  CATEGORY_NAMES.RAM,
  CATEGORY_NAMES.STORAGE,
  CATEGORY_NAMES.GPU,
  CATEGORY_NAMES.PSU,
  CATEGORY_NAMES.CABINET,
  CATEGORY_NAMES.COOLER,
  CATEGORY_NAMES.MONITOR,
  CATEGORY_NAMES.PERIPHERAL
];

export const CATEGORY_HIERARCHY: CategoryNode[] = [
  // ─── Custom Liquid Cooling ───────────────────────────────────────────────
  {
    label: 'Custom Liquid Cooling',
    category: CATEGORY_NAMES.COOLER,
    children: [
      { label: 'CPU Water Block', query: 'Water Block' },
      { label: 'GPU Water Block', query: 'GPU Block' },
      { label: 'Pump And Reservoir', query: 'Pump' },
      { label: 'Radiator', query: 'Radiator' },
      { label: 'Tubing', query: 'Tubing' },
      { label: 'Fitting Adapters', query: 'Fitting' },
      { label: 'Coolant', query: 'Coolant' },
      { label: 'Distro Plate', query: 'Distro' },
      { label: 'DIY Accessories', query: 'Accessory' },
    ]
  },

  // ─── Processor ───────────────────────────────────────────────────────────
  {
    label: 'Processor',
    category: CATEGORY_NAMES.PROCESSOR,
    children: [
      { label: 'Extreme-level Processor', query: 'Extreme' },
      { label: 'High-end Processor', query: 'High-end' },
      { label: 'Mid-Range Processor', query: 'Mid-Range' },
      { label: 'Entry-level Processor', query: 'Entry' },
      { label: 'Server CPU', query: 'Server' },
    ]
  },

  // ─── CPU Cooler ──────────────────────────────────────────────────────────
  {
    label: 'CPU Cooler',
    category: CATEGORY_NAMES.COOLER,
    children: [
      { label: 'Liquid Cooler', query: 'Liquid' },
      { label: 'Thermal Paste', query: 'Paste' },
      { label: 'Air Cooler', query: 'Air Cooler' },
      { label: 'Cooling Accessories', query: 'Accessory' },
    ]
  },

  // ─── Motherboard ─────────────────────────────────────────────────────────
  {
    label: 'Motherboard',
    category: CATEGORY_NAMES.MOTHERBOARD,
    children: [
      {
        label: 'AMD Chipset',
        children: [
          { label: 'X870', query: 'X870' },
          { label: 'X670', query: 'X670' },
          { label: 'B650', query: 'B650' },
          { label: 'B550', query: 'B550' },
          { label: 'B450', query: 'B450' },
          { label: 'A620', query: 'A620' },
          { label: 'A520', query: 'A520' },
        ]
      },
      {
        label: 'Intel Chipset',
        children: [
          { label: 'Z890', query: 'Z890' },
          { label: 'Z790', query: 'Z790' },
          { label: 'B760', query: 'B760' },
          { label: 'H610', query: 'H610' },
          { label: 'H510', query: 'H510' },
        ]
      },
      { label: 'Overclocking Motherboard', query: 'Overclocking' },
      { label: 'Workstation Motherboard', query: 'Workstation' },
    ]
  },

  // ─── Graphics Card ───────────────────────────────────────────────────────
  {
    label: 'Graphics Card',
    category: CATEGORY_NAMES.GPU,
    children: [
      { label: 'Intel Arc Graphics Card', query: 'Arc' },
      {
        label: 'Nvidia',
        children: [
          { label: 'RTX 50 Series', query: '50 Series' },
          { label: 'RTX 40 Series', query: '40 Series' },
          { label: 'RTX 30 Series', query: '30 Series' },
          { label: 'Quadro', query: 'Quadro' },
        ]
      },
      { label: 'Graphics Card Accessories', query: 'Accessory' },
      {
        label: 'Amd Radeon',
        children: [
          { label: 'RX 9000 Series', query: '9000' },
          { label: 'RX 7000 Series', query: '7000' },
          { label: 'RX 6000 Series', query: '6000' },
        ]
      },
    ]
  },

  // ─── RAM ─────────────────────────────────────────────────────────────────
  {
    label: 'RAM',
    category: CATEGORY_NAMES.RAM,
    children: [
      { label: 'Desktop Ram', query: 'Desktop' },
      { label: 'Laptop Ram', query: 'Laptop' },
      { label: 'DDR4 Ram', query: 'DDR4' },
      { label: 'DDR3 Ram', query: 'DDR3' },
      { label: 'DDR5 Ram', query: 'DDR5' },
      { label: 'Single Channel Ram', query: 'Single' },
      { label: 'Dual Channel Ram', query: 'Dual' },
      { label: 'Quad Channel Ram', query: 'Quad' },
    ]
  },

  // ─── Storage ─────────────────────────────────────────────────────────────
  {
    label: 'Storage',
    category: CATEGORY_NAMES.STORAGE,
    children: [
      {
        label: 'HDD',
        children: [
          { label: 'Internal HDD', query: 'Internal' },
          { label: 'External HDD', query: 'External' },
          { label: 'Enterprise HDD', query: 'Enterprise' },
        ]
      },
      {
        label: 'SSD',
        children: [
          { label: 'NVMe Gen5', query: 'Gen5' },
          { label: 'NVMe Gen4', query: 'Gen4' },
          { label: 'NVMe Gen3', query: 'Gen3' },
          { label: 'SATA 2.5"', query: 'SATA' },
          { label: 'External SSD', query: 'External' },
        ]
      },
      { label: 'Pen Drive', query: 'Pen Drive' },
    ]
  },

  // ─── SMPS (Power Supply) ─────────────────────────────────────────────────
  {
    label: 'SMPS (PSU)',
    category: CATEGORY_NAMES.PSU,
    children: [
      { label: 'Non Modular', query: 'Non Modular' },
      { label: 'Fully Modular', query: 'Fully Modular' },
      { label: 'Semi Modular', query: 'Semi Modular' },
      { label: 'Platinum', query: 'Platinum' },
      { label: 'Gold', query: 'Gold' },
      { label: 'Bronze', query: 'Bronze' },
    ]
  },

  // ─── Cabinet ─────────────────────────────────────────────────────────────
  {
    label: 'Cabinet',
    category: CATEGORY_NAMES.CABINET,
    children: [
      { label: 'Full Tower', query: 'Full Tower' },
      { label: 'ARGB', query: 'ARGB' },
      { label: 'Mid Tower', query: 'Mid Tower' },
      { label: 'Case Accessories', query: 'Accessory' },
      { label: 'Mini Tower', query: 'Mini Tower' },
      { label: 'With RGB Fan', query: 'RGB Fan' },
      { label: 'DIY', query: 'DIY' },
      { label: 'With SMPS', query: 'SMPS' },
      { label: 'Under INR 3500', query: 'Budget' },
      { label: 'Small Form Factor', query: 'SFF' },
    ]
  },

  // ─── Monitor ─────────────────────────────────────────────────────────────
  {
    label: 'Monitor',
    category: CATEGORY_NAMES.MONITOR,
    children: [
      { label: '22 inch', query: '22' },
      { label: '24 inch', query: '24' },
      { label: '27 inch', query: '27' },
      { label: '2K', query: '2K' },
      { label: '32 inch', query: '32' },
      { label: '34 inch', query: '34' },
      { label: '4K', query: '4K' },
      { label: 'Gaming', query: 'Gaming' },
      { label: 'Curved', query: 'Curved' },
      { label: 'Professional', query: 'Professional' },
    ]
  },

  // ─── Peripherals ─────────────────────────────────────────────────────────
  {
    label: 'Peripherals',
    category: CATEGORY_NAMES.PERIPHERAL,
    children: [
      { label: 'Headset', query: 'Headset' },
      {
        label: 'Keyboard',
        children: [
          { label: 'Mechanical', query: 'Mechanical' },
          { label: 'Gaming', query: 'Gaming' },
          { label: 'Wireless', query: 'Wireless' },
          { label: 'Wired', query: 'Wired' },
          { label: 'Combos', query: 'Combo' },
        ]
      },
      {
        label: 'Mouse',
        children: [
          { label: 'Gaming', query: 'Gaming' },
          { label: 'RGB', query: 'RGB' },
          { label: 'Wired', query: 'Wired' },
          { label: 'Wireless', query: 'Wireless' },
          { label: 'Combos', query: 'Combo' },
        ]
      },
      { label: 'Mouse Pad', query: 'Mouse Pad' },
      {
        label: 'Networking',
        category: CATEGORY_NAMES.NETWORKING,
        children: [
          { label: 'Router', query: 'Router' },
          { label: 'Switch', query: 'Switch' },
          { label: 'Cable', query: 'Cable' },
          { label: 'Adapter', query: 'Adapter' },
        ]
      },
      {
        label: 'Printer & Scanner',
        children: [
          { label: 'Printer', query: 'Printer' },
          { label: 'Scanner', query: 'Scanner' },
          { label: 'Cartridge', query: 'Cartridge' },
          { label: 'Toner', query: 'Toner' },
        ]
      },
      { label: 'Software', query: 'Software' },
      { label: 'Speaker', query: 'Speaker' },
      { label: 'Headphone', query: 'Headphone' },
      { label: 'Webcam', query: 'Webcam' },
    ]
  },

  // ─── Laptop ──────────────────────────────────────────────────────────────
  {
    label: 'Laptop',
    category: 'Laptop',
  },
];

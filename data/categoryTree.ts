
import { Category } from '../types';

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
  // Filter logic
  category?: Category;
  brand?: string;
  query?: string; // Matches against product name or specs
  isOpen?: boolean; // Initial UI state
}

export const BUILD_SEQUENCE = [
  Category.PROCESSOR,
  Category.MOTHERBOARD,
  Category.RAM,
  Category.STORAGE,
  Category.GPU,
  Category.PSU,
  Category.CABINET,
  Category.COOLER,
  Category.MONITOR,
  Category.PERIPHERAL
];

export const CATEGORY_HIERARCHY: CategoryNode[] = [
  {
    label: 'Cooling',
    category: Category.COOLER,
    children: [
      {
        label: 'DIY Cooling',
        children: [
          { label: 'CPU Water Block', query: 'Water Block' },
          { label: 'GPU Water Block', query: 'GPU Block' },
          { label: 'Pump & Reservoir', query: 'Pump' },
          { label: 'Fitting Adapter', query: 'Fitting' },
          { label: 'Tubing', query: 'Tubing' },
          { label: 'Coolant', query: 'Coolant' },
          { label: 'Radiator', query: 'Radiator' },
          { label: 'Distro Plate', query: 'Distro' },
          { label: 'Accessories', query: 'Accessory' },
        ]
      },
      {
        label: 'CPU Cooler',
        children: [
          {
            label: 'AIO Liquid Cooler',
            children: [
              { label: 'ARGB AIO Cooler', query: 'ARGB AIO' },
              { label: 'RGB AIO Cooler', query: 'RGB AIO' },
              { label: 'LCD AIO Cooler', query: 'LCD' },
            ]
          },
          {
            label: 'Air Cooler',
            children: [
              { label: 'ARGB Air Cooler', query: 'ARGB Air' },
              { label: 'RGB Air Cooler', query: 'RGB Air' },
              { label: 'LED Air Cooler', query: 'LED Air' },
            ]
          },
          { label: 'Accessories', query: 'Paste' }
        ]
      },
      {
        label: 'Shop By Brand',
        children: [
          { label: 'Cooler Master', brand: 'Cooler Master' },
          { label: 'DeepCool', brand: 'DeepCool' },
          { label: 'Lian Li', brand: 'Lian Li' },
          { label: 'NZXT', brand: 'NZXT' },
        ]
      }
    ]
  },
  {
    label: 'Processor',
    category: Category.PROCESSOR,
    children: [
      {
        label: 'AMD',
        brand: 'AMD',
        children: [
          { label: 'Ryzen 3', query: 'Ryzen 3' },
          { label: 'Ryzen 5', query: 'Ryzen 5' },
          { label: 'Ryzen 7', query: 'Ryzen 7' },
          { label: 'Ryzen 9', query: 'Ryzen 9' },
          { label: 'Ryzen Threadripper', query: 'Threadripper' },
          {
            label: 'Series',
            children: [
              { label: 'AMD 9000 Series', query: '9000' },
              { label: 'AMD 8000 Series', query: '8000' },
              { label: 'AMD 7000 Series', query: '7000' },
              { label: 'AMD 5000 Series', query: '5000' },
              { label: 'AMD 4000 Series', query: '4000' },
              { label: 'AMD 3000 Series', query: '3000' },
            ]
          }
        ]
      },
      {
        label: 'Intel',
        brand: 'Intel',
        children: [
          { label: 'Core i3', query: 'i3' },
          { label: 'Core i5', query: 'i5' },
          { label: 'Core i7', query: 'i7' },
          { label: 'Core i9', query: 'i9' },
          { label: 'Core Ultra 5', query: 'Ultra 5' },
          { label: 'Core Ultra 7', query: 'Ultra 7' },
          { label: 'Core Ultra 9', query: 'Ultra 9' },
          {
            label: 'Gen',
            children: [
              { label: 'Intel 14th Gen', query: '14th' },
              { label: 'Intel 13th Gen', query: '13th' },
              { label: 'Intel 12th Gen', query: '12th' },
              { label: 'Intel 11th Gen', query: '11th' },
              { label: 'Intel 10th Gen', query: '10th' },
            ]
          }
        ]
      }
    ]
  },
  {
    label: 'Motherboard',
    category: Category.MOTHERBOARD,
    children: [
      {
        label: 'AMD Chipset',
        brand: 'AMD', 
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
      {
        label: 'Shop By Brand',
        children: [
          { label: 'ASUS', brand: 'ASUS' },
          { label: 'ASRock', brand: 'ASRock' },
          { label: 'Gigabyte', brand: 'Gigabyte' },
          { label: 'MSI', brand: 'MSI' },
        ]
      }
    ]
  },
  {
    label: 'Graphics Card',
    category: Category.GPU,
    children: [
      {
        label: 'AMD GPU',
        children: [
          { label: 'RX 9000 Series', query: '9000' },
          { label: 'RX 7000 Series', query: '7000' },
          { label: 'RX 6000 Series', query: '6000' },
        ]
      },
      {
        label: 'NVIDIA GPU',
        children: [
          { label: 'RTX 50 Series', query: '50 Series' },
          { label: 'RTX 40 Series', query: '40 Series' },
          { label: 'RTX 30 Series', query: '30 Series' },
          { label: 'Quadro', query: 'Quadro' },
        ]
      },
      { label: 'Intel Arc', query: 'Arc' },
      {
        label: 'Shop By Brand',
        children: [
          { label: 'ASUS', brand: 'ASUS' },
          { label: 'ASRock', brand: 'ASRock' },
          { label: 'Gigabyte', brand: 'Gigabyte' },
          { label: 'Inno3D', brand: 'Inno3D' },
          { label: 'MSI', brand: 'MSI' },
          { label: 'Sapphire', brand: 'Sapphire' },
          { label: 'Zotac', brand: 'Zotac' },
        ]
      }
    ]
  },
  {
    label: 'RAM',
    category: Category.RAM,
    children: [
      { label: 'Desktop', query: 'Desktop' },
      { label: 'Laptop', query: 'Laptop' },
      {
        label: 'By Kit',
        children: [
           { label: 'Single Channel', query: 'Single' },
           { label: 'Dual Channel', query: 'Dual' },
           { label: 'Quad Channel', query: 'Quad' },
        ]
      },
      {
        label: 'By Type',
        children: [
           { label: 'DDR5', query: 'DDR5' },
           { label: 'DDR4', query: 'DDR4' },
           { label: 'DDR3', query: 'DDR3' },
        ]
      },
      {
        label: 'By Brand',
        children: [
          { label: 'Adata', brand: 'Adata' },
          { label: 'Corsair', brand: 'Corsair' },
          { label: 'G.Skill', brand: 'G.Skill' },
          { label: 'Kingston', brand: 'Kingston' },
          { label: 'Thermaltake', brand: 'Thermaltake' },
        ]
      }
    ]
  },
  {
    label: 'Storage',
    category: Category.STORAGE,
    children: [
      {
         label: 'HDD',
         children: [
            { label: 'Internal', query: 'Internal' },
            { label: 'External', query: 'External' },
            { label: 'Enterprise', query: 'Enterprise' },
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
      {
        label: 'Other',
        children: [
           { label: 'Pen Drive', query: 'Drive' },
           { label: 'Memory Card', query: 'Card' },
           { label: 'Enclosure', query: 'Enclosure' },
        ]
      },
      {
        label: 'Shop By Brand',
        children: [
          { label: 'Adata', brand: 'Adata' },
          { label: 'Ant Esports', brand: 'Ant' },
          { label: 'Kingston', brand: 'Kingston' },
          { label: 'Samsung', brand: 'Samsung' },
          { label: 'Western Digital', brand: 'Western Digital' },
        ]
      }
    ]
  },
  {
    label: 'SMPS (PSU)',
    category: Category.PSU,
    children: [
      {
        label: 'Certification',
        children: [
           { label: '80 Plus Platinum', query: 'Platinum' },
           { label: '80 Plus Gold', query: 'Gold' },
           { label: '80 Plus Bronze', query: 'Bronze' },
        ]
      },
      {
        label: 'Modular',
        children: [
           { label: 'Fully Modular', query: 'Fully' },
           { label: 'Semi Modular', query: 'Semi' },
           { label: 'Non Modular', query: 'Non' },
        ]
      },
      {
        label: 'Shop By Brand',
        children: [
          { label: 'ASUS', brand: 'ASUS' },
          { label: 'DeepCool', brand: 'DeepCool' },
          { label: 'MSI', brand: 'MSI' },
          { label: 'Super Flower', brand: 'Super Flower' },
        ]
      }
    ]
  },
  {
    label: 'Cabinet',
    category: Category.CABINET,
    children: [
      {
         label: 'Form Factor',
         children: [
            { label: 'Full Tower', query: 'Full' },
            { label: 'Mid Tower', query: 'Mid' },
            { label: 'Mini Tower', query: 'Mini' },
         ]
      },
      {
         label: 'Cabinet Fans',
         children: [
            { label: 'ARGB', query: 'ARGB' },
            { label: 'RGB', query: 'RGB' },
            { label: 'LED', query: 'LED' },
            { label: 'Non-LED', query: 'Non-LED' },
         ]
      },
      {
         label: 'Style',
         children: [
            { label: 'ARGB Case', query: 'ARGB' },
            { label: 'RGB Case', query: 'RGB' },
         ]
      },
      {
         label: 'Accessories',
         children: [
            { label: 'RGB LED Strips', query: 'Strip' },
            { label: 'Digital RGB Controller', query: 'Controller' },
            { label: 'GPU Holder', query: 'Holder' },
            { label: 'Riser Cable', query: 'Riser' },
         ]
      }
    ]
  },
  {
    label: 'Monitor',
    category: Category.MONITOR,
    children: [
      {
         label: 'By Type',
         children: [
            { label: 'Gaming', query: 'Gaming' },
            { label: 'Professional', query: 'Professional' },
            { label: '4K', query: '4K' },
            { label: '2K', query: '2K' },
         ]
      },
      {
         label: 'By Size',
         children: [
            { label: '34 Inch', query: '34' },
            { label: '32 Inch', query: '32' },
            { label: '27 Inch', query: '27' },
            { label: '24 Inch', query: '24' },
            { label: '22 Inch', query: '22' },
         ]
      },
      {
        label: 'By Brand',
        children: [
          { label: 'Asus', brand: 'Asus' },
          { label: 'BenQ', brand: 'BenQ' },
          { label: 'LG', brand: 'LG' },
          { label: 'MSI', brand: 'MSI' },
          { label: 'Samsung', brand: 'Samsung' },
          { label: 'ViewSonic', brand: 'ViewSonic' },
        ]
      }
    ]
  },
  {
    label: 'Peripherals',
    category: Category.PERIPHERAL,
    children: [
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
      { label: 'Mouse Mats', query: 'Mat' },
      {
        label: 'Headsets',
        children: [
          { label: 'Wired', query: 'Wired' },
          { label: 'Wireless', query: 'Wireless' },
          { label: 'Bluetooth', query: 'Bluetooth' },
        ]
      },
      {
         label: 'Networking',
         category: Category.NETWORKING,
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
      {
         label: 'Accessories',
         children: [
            { label: 'Webcam', query: 'Webcam' },
            { label: 'UPS', query: 'UPS' },
            { label: 'Surge Protector', query: 'Surge' },
            { label: 'Pen Tablet', query: 'Tablet' },
            { label: 'Speaker', query: 'Speaker' },
            { label: 'Modular Cables', query: 'Cable' },
         ]
      }
    ]
  }
];

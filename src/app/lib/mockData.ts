// Mock data for the B2B product catalog
// This file contains sample data for demonstration purposes
// In production, this would be replaced with API calls to a backend/database

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryName: string;
  brand: string;
  price: number | null;
  priceLabel?: string;
  image: string;
  images: string[];
  description: string;
  shortDescription: string;
  specifications: Record<string, string>;
  features: string[];
  tags: string[];
  inStock: boolean;
  featured: boolean;
  datasheet?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const categories: Category[] = [
  {
    id: "drones",
    name: "Drones & UAV",
    slug: "drones",
    description: "Professional drones and UAV systems",
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
    productCount: 24,
  },
  {
    id: "rf-modules",
    name: "RF Modules",
    slug: "rf-modules",
    description: "Radio frequency communication modules",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    productCount: 45,
  },
  {
    id: "fiber-optics",
    name: "Fiber Optics",
    slug: "fiber-optics",
    description: "Fiber optic cables and equipment",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    productCount: 32,
  },
  {
    id: "electronics",
    name: "Electronics Components",
    slug: "electronics",
    description: "Industrial electronic components",
    image: "https://images.unsplash.com/photo-1601524924-8fc5f87edc2a?w=800&q=80",
    productCount: 156,
  },
  {
    id: "sensors",
    name: "Sensors & IoT",
    slug: "sensors",
    description: "Industrial sensors and IoT devices",
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&q=80",
    productCount: 67,
  },
  {
    id: "industrial",
    name: "Industrial Equipment",
    slug: "industrial",
    description: "Industrial automation equipment",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    productCount: 89,
  },
];

export const products: Product[] = [
  {
    id: "drone-001",
    name: "DJI Mavic 3 Enterprise",
    slug: "dji-mavic-3-enterprise",
    category: "drones",
    categoryName: "Drones & UAV",
    brand: "DJI",
    price: 4999,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
      "https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&q=80",
      "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=80",
    ],
    shortDescription: "Professional enterprise drone with thermal camera",
    description: "The DJI Mavic 3 Enterprise is a professional-grade drone designed for industrial applications. Features advanced thermal imaging, RTK positioning, and extended flight time.",
    specifications: {
      "Flight Time": "45 minutes",
      "Max Speed": "19 m/s",
      "Camera Resolution": "20MP",
      "Thermal Resolution": "640×512",
      "Max Altitude": "6000m",
      "Wind Resistance": "12 m/s",
      "Weight": "915g",
      "Storage": "8GB Internal",
    },
    features: [
      "4/3 CMOS Hasselblad camera",
      "56× Hybrid Zoom with thermal camera",
      "RTK for centimeter-level positioning",
      "Omnidirectional obstacle sensing",
      "IP54 weather resistance",
      "Advanced flight planning software",
    ],
    tags: ["Professional", "Thermal", "RTK", "Industrial"],
    inStock: true,
    featured: true,
    datasheet: "#",
  },
  {
    id: "rf-001",
    name: "LoRa SX1276 RF Module",
    slug: "lora-sx1276-rf-module",
    category: "rf-modules",
    categoryName: "RF Modules",
    brand: "Semtech",
    price: 15.99,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    ],
    shortDescription: "Long-range wireless communication module",
    description: "SX1276 LoRa transceiver module for long-range, low-power wireless communication. Ideal for IoT applications.",
    specifications: {
      "Frequency Range": "137-1020 MHz",
      "Modulation": "LoRa, FSK, GFSK, MSK, GMSK, OOK",
      "Output Power": "+20 dBm",
      "Sensitivity": "-148 dBm",
      "Range": "Up to 15km",
      "Supply Voltage": "1.8V - 3.7V",
      "Interface": "SPI",
      "Package": "QFN28",
    },
    features: [
      "Ultra-long range communication",
      "Low power consumption",
      "High interference immunity",
      "Automatic frequency hopping",
      "Built-in packet handler",
    ],
    tags: ["LoRa", "IoT", "Long-range", "Wireless"],
    inStock: true,
    featured: true,
  },
  {
    id: "fiber-001",
    name: "Single Mode Fiber Cable 9/125",
    slug: "single-mode-fiber-cable",
    category: "fiber-optics",
    categoryName: "Fiber Optics",
    brand: "Corning",
    price: null,
    priceLabel: "Request Quote",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    ],
    shortDescription: "High-performance single mode fiber optic cable",
    description: "Premium single mode fiber optic cable for long-distance, high-bandwidth applications. Available in various lengths.",
    specifications: {
      "Core/Cladding": "9/125 μm",
      "Cable Type": "Single Mode",
      "Attenuation": "≤0.35 dB/km @ 1310nm",
      "Bandwidth": "Unlimited",
      "Distance": "Up to 100km",
      "Jacket": "LSZH",
      "Temperature": "-40°C to +70°C",
      "Connectors": "LC, SC, FC (optional)",
    },
    features: [
      "Ultra-low attenuation",
      "High bandwidth capacity",
      "Long-distance transmission",
      "Low-smoke zero-halogen jacket",
      "Bend-insensitive design",
    ],
    tags: ["Fiber", "Network", "Telecom", "Infrastructure"],
    inStock: true,
    featured: false,
  },
  {
    id: "elec-001",
    name: "Raspberry Pi 4 Model B 8GB",
    slug: "raspberry-pi-4-8gb",
    category: "electronics",
    categoryName: "Electronics Components",
    brand: "Raspberry Pi",
    price: 75,
    image: "https://images.unsplash.com/photo-1601524924-8fc5f87edc2a?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1601524924-8fc5f87edc2a?w=800&q=80",
    ],
    shortDescription: "8GB RAM single-board computer",
    description: "Raspberry Pi 4 Model B with 8GB RAM. Perfect for industrial applications, automation, and development projects.",
    specifications: {
      "Processor": "Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz",
      "RAM": "8GB LPDDR4-3200",
      "Connectivity": "2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE",
      "Ethernet": "Gigabit Ethernet",
      "USB": "2x USB 3.0, 2x USB 2.0",
      "GPIO": "40-pin GPIO header",
      "Video": "2x micro-HDMI ports (up to 4Kp60)",
      "Power": "5V DC via USB-C",
    },
    features: [
      "8GB LPDDR4 RAM for demanding applications",
      "Dual 4K display support",
      "Gigabit Ethernet",
      "USB 3.0 ports",
      "40-pin GPIO header",
      "Hardware video decode at 4Kp60",
    ],
    tags: ["SBC", "IoT", "Development", "ARM"],
    inStock: true,
    featured: true,
  },
  {
    id: "sensor-001",
    name: "Industrial Temperature Sensor PT100",
    slug: "pt100-temperature-sensor",
    category: "sensors",
    categoryName: "Sensors & IoT",
    brand: "Omega",
    price: 45.50,
    image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&q=80",
    ],
    shortDescription: "High-precision RTD temperature sensor",
    description: "PT100 RTD temperature sensor for industrial applications. High accuracy and long-term stability.",
    specifications: {
      "Sensor Type": "PT100 RTD",
      "Temperature Range": "-200°C to +600°C",
      "Accuracy": "Class A (±0.15°C @ 0°C)",
      "Response Time": "< 5 seconds",
      "Probe Length": "150mm",
      "Probe Diameter": "6mm",
      "Connection": "3-wire",
      "Protection": "IP68",
    },
    features: [
      "High accuracy Class A RTD",
      "Wide temperature range",
      "Fast response time",
      "Waterproof IP68 rated",
      "Stainless steel construction",
    ],
    tags: ["Sensor", "Temperature", "RTD", "Industrial"],
    inStock: true,
    featured: false,
  },
  {
    id: "ind-001",
    name: "PLC Siemens S7-1200",
    slug: "siemens-s7-1200-plc",
    category: "industrial",
    categoryName: "Industrial Equipment",
    brand: "Siemens",
    price: 650,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    ],
    shortDescription: "Programmable Logic Controller for automation",
    description: "Siemens S7-1200 PLC for small to medium automation tasks. Compact design with integrated I/O.",
    specifications: {
      "CPU": "S7-1200 CPU 1214C",
      "Digital Inputs": "14 x 24V DC",
      "Digital Outputs": "10 x 24V DC",
      "Analog Inputs": "2",
      "Memory": "100 KB work memory",
      "Communication": "PROFINET, Ethernet",
      "Power Supply": "24V DC",
      "Dimensions": "110 x 100 x 75 mm",
    },
    features: [
      "Compact modular design",
      "Integrated PROFINET interface",
      "Expandable with signal modules",
      "TIA Portal programming",
      "Motion control capabilities",
    ],
    tags: ["PLC", "Automation", "Industrial", "Siemens"],
    inStock: true,
    featured: true,
  },
];

// Helper functions
export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter((p) => p.category === categoryId);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.featured);
};

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find((c) => c.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      p.brand.toLowerCase().includes(lowercaseQuery)
  );
};
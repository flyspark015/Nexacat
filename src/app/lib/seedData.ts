/**
 * Demo data seeding script for FlySpark B2B Catalog
 * 
 * This demonstrates the Simple vs Variable product system
 * 
 * To seed data:
 * 1. Make sure you have an "Ecat" category in Firestore
 * 2. You must be logged in as admin
 * 3. Call seedDemoProducts() from admin panel
 */

import { createProduct, getCategories, createCategory, updateSettings } from "./firestoreService";
import { Product, ProductVariation } from "./types";

/**
 * Seed default company and payment settings for ANUSHAKTI INFOTECH
 */
export const seedCompanySettings = async (): Promise<void> => {
  try {
    await updateSettings({
      id: "app-settings",
      companyName: "ANUSHAKTI INFOTECH PVT. LTD.",
      companyAddress: "E-317, Siddhraj Z-Square,\nPodar International School Road,\nKudasan, Gandhinagar,\nGujarat - 382421, India",
      gstNumber: "24ABCCA1331J1Z5",
      iecCode: "ABCCA1331J",
      whatsappNumber: "+91-9461785001",
      currency: "INR",
      supportEmail: "contact@anushakti.com",
      footerAddress: "E-317, Siddhraj Z-Square, Kudasan, Gandhinagar, Gujarat - 382421",
      
      // Payment Details
      bankAccountName: "ANUSHAKTI INFOTECH PVT. LTD.",
      bankAccountNumber: "63773716130",
      bankIfscCode: "IDFB0040303",
      bankUcic: "6583633571",
      bankName: "IDFC FIRST Bank",
      upiId: "anushaktiinfotech@idfcbank",
      // paymentQrCodeUrl will use default embedded QR code if not set
    });
    
    console.log("✅ Company settings seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding company settings:", error);
    throw error;
  }
};

/**
 * Create demo products with real scenarios
 */
export const seedDemoProducts = async (): Promise<void> => {
  try {
    // Ensure Ecat category exists
    let categories = await getCategories();
    let ecatCategory = categories.find((c) => c.slug === "ecat");

    if (!ecatCategory) {
      // Create Ecat category
      const ecatId = await createCategory({
        name: "Ecat",
        slug: "ecat",
        imageLocalPath: "/placeholder-category.png",
      });
      ecatCategory = { id: ecatId, name: "Ecat", slug: "ecat", imageLocalPath: "/placeholder-category.png" };
    }

    const categoryId = ecatCategory.id;

    // =========================================================================
    // DEMO 1: Simple Product with Single Image
    // =========================================================================
    
    const product1: Omit<Product, "id" | "createdAt"> = {
      name: "Professional Drone X1",
      slug: "professional-drone-x1",
      sku: "DRONE-X1",
      categoryId,
      brand: "SkyTech",
      tags: ["Professional", "4K Camera", "GPS"],
      description: "High-performance drone with 4K camera and 30-minute flight time. Perfect for professional aerial photography and videography.",
      specs: {
        "Flight Time": "30 minutes",
        "Camera Resolution": "4K UHD",
        "Max Range": "5 km",
        "Weight": "895g",
        "GPS": "Yes",
      },
      productType: "simple",
      price: 89999,
      isPriceVisible: true,
      images: ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800"],
      mainImageIndex: 0,
      stockStatus: "in-stock",
      status: "active",
    };

    await createProduct(product1);
    console.log("✅ Created: Simple product with single image");

    // =========================================================================
    // DEMO 2: Simple Product with Multiple Images
    // =========================================================================
    
    const product2: Omit<Product, "id" | "createdAt"> = {
      name: "Industrial Camera IC-5000",
      slug: "industrial-camera-ic-5000",
      sku: "CAM-IC5000",
      categoryId,
      brand: "VisionPro",
      tags: ["Industrial", "High Resolution", "Ruggedized"],
      description: "Industrial-grade camera with multiple mounting options. Features weather-resistant housing and advanced image processing.",
      specs: {
        "Sensor": "1/2.3 inch CMOS",
        "Resolution": "12MP",
        "Frame Rate": "60 fps",
        "Interface": "USB 3.0, Ethernet",
        "Housing": "IP67 Weather Resistant",
      },
      productType: "simple",
      price: 54999,
      isPriceVisible: true,
      images: [
        "https://images.unsplash.com/photo-1606166325683-7d7c1e0d98de?w=800",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
        "https://images.unsplash.com/photo-1601944177325-f8867652837f?w=800",
      ],
      mainImageIndex: 0,
      stockStatus: "in-stock",
      status: "active",
    };

    await createProduct(product2);
    console.log("✅ Created: Simple product with multiple images");

    // =========================================================================
    // DEMO 3: Variable Product - Different Storage + Color Options
    // Each variation mapped to different image
    // =========================================================================
    
    const product3: Omit<Product, "id" | "createdAt"> = {
      name: "SmartTab Pro Tablet",
      slug: "smarttab-pro-tablet",
      categoryId,
      brand: "TechCorp",
      tags: ["Tablet", "Android", "Business"],
      description: "Professional tablet with multiple storage and color options. Perfect for business presentations and productivity.",
      specs: {
        "Display": "10.5 inch IPS",
        "Processor": "Octa-core 2.4GHz",
        "RAM": "4GB",
        "OS": "Android 13",
        "Battery": "8000mAh",
      },
      productType: "variable",
      isPriceVisible: true,
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", // Black
        "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800", // Silver
        "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", // Gold
      ],
      mainImageIndex: 0,
      stockStatus: "in-stock",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      status: "active",
    };

    const product3Variations: ProductVariation[] = [
      {
        id: "var-1",
        variationName: "64GB Black",
        price: 24999,
        sku: "TAB-64GB-BLK",
        variationImageIndex: 0,
        status: "active",
      },
      {
        id: "var-2",
        variationName: "128GB Silver",
        price: 29999,
        sku: "TAB-128GB-SLV",
        variationImageIndex: 1,
        status: "active",
      },
      {
        id: "var-3",
        variationName: "256GB Gold",
        price: 34999,
        sku: "TAB-256GB-GLD",
        variationImageIndex: 2,
        status: "active",
      },
    ];

    await createProduct(product3, product3Variations);
    console.log("✅ Created: Variable product with 3 variations (image switching)");

    // =========================================================================
    // DEMO 4: Variable Product - Service Tiers
    // Different prices, no specific image mapping
    // =========================================================================
    
    const product4: Omit<Product, "id" | "createdAt"> = {
      name: "Cloud Server Hosting",
      slug: "cloud-server-hosting",
      categoryId,
      brand: "CloudXpert",
      tags: ["Cloud", "Hosting", "Scalable"],
      description: "Flexible cloud hosting plans for businesses. Choose the plan that fits your needs.",
      specs: {
        "Uptime": "99.9%",
        "Data Centers": "Global",
        "Backup": "Daily Automated",
        "Support": "24/7",
      },
      productType: "variable",
      isPriceVisible: true,
      images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"],
      mainImageIndex: 0,
      stockStatus: "in-stock",
      status: "active",
    };

    const product4Variations: ProductVariation[] = [
      {
        id: "var-1",
        variationName: "Basic Plan (2 vCPU, 4GB RAM)",
        price: 1999,
        sku: "HOST-BASIC",
        status: "active",
      },
      {
        id: "var-2",
        variationName: "Business Plan (4 vCPU, 8GB RAM)",
        price: 3999,
        sku: "HOST-BUSINESS",
        status: "active",
      },
    ];

    await createProduct(product4, product4Variations);
    console.log("✅ Created: Variable product with 2 variations (different prices)");

    // =========================================================================
    // DEMO 5: Out of Stock Product
    // =========================================================================
    
    const product5: Omit<Product, "id" | "createdAt"> = {
      name: "Limited Edition Sensor Pro",
      slug: "limited-edition-sensor-pro",
      sku: "SENSOR-PRO-LE",
      categoryId,
      brand: "SensorTech",
      tags: ["Limited Edition", "Professional", "Sold Out"],
      description: "Premium industrial sensor - currently out of stock. Contact us for availability.",
      specs: {
        "Range": "0-100m",
        "Accuracy": "±0.1%",
        "Interface": "RS485, Modbus",
        "Housing": "Stainless Steel",
      },
      productType: "simple",
      price: 12999,
      isPriceVisible: true,
      images: ["https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800"],
      mainImageIndex: 0,
      stockStatus: "out-of-stock",
      status: "active",
    };

    await createProduct(product5);
    console.log("✅ Created: Out of stock product");

    console.log("\n🎉 Successfully seeded 5 demo products in Ecat category!");
    console.log("\n📋 Summary:");
    console.log("  1. Simple product with single image");
    console.log("  2. Simple product with multiple images");
    console.log("  3. Variable product (3 variations, image switching)");
    console.log("  4. Variable product (2 variations, price tiers)");
    console.log("  5. Out of stock product");
    console.log("\nVisit /category/ecat to see the demo products!");

  } catch (error) {
    console.error("❌ Error seeding demo products:", error);
    throw error;
  }
};
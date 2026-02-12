import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Product, Category, Order, User, ProductVariation, SystemSettings } from "./types";

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const querySnapshot = await getDocs(collection(db, "categories"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];
};

export const getCategory = async (id: string): Promise<Category | null> => {
  const docSnap = await getDoc(doc(db, "categories", id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Category;
  }
  return null;
};

export const createCategory = async (data: Omit<Category, "id">) => {
  const docRef = await addDoc(collection(db, "categories"), data);
  return docRef.id;
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  await updateDoc(doc(db, "categories", id), data);
};

export const deleteCategory = async (id: string) => {
  await deleteDoc(doc(db, "categories", id));
};

// Products
export const getProducts = async (status?: "active" | "draft"): Promise<Product[]> => {
  let q = collection(db, "products");
  let queryRef = status
    ? query(collection(db, "products"), where("status", "==", status))
    : collection(db, "products");

  const querySnapshot = await getDocs(queryRef);
  const products = await Promise.all(
    querySnapshot.docs.map(async (docSnapshot) => {
      const productData = docSnapshot.data();
      
      // Get variations if product is variable
      let variations: ProductVariation[] = [];
      if (productData.productType === "variable") {
        const variationsSnapshot = await getDocs(
          collection(db, "products", docSnapshot.id, "variations")
        );
        variations = variationsSnapshot.docs.map((varDoc) => ({
          id: varDoc.id,
          ...varDoc.data(),
        })) as ProductVariation[];
      }

      return {
        id: docSnapshot.id,
        ...productData,
        createdAt: productData.createdAt?.toDate() || new Date(),
        variations: variations.length > 0 ? variations : undefined,
      } as Product;
    })
  );

  return products;
};

export const getProduct = async (id: string): Promise<Product | null> => {
  const docSnap = await getDoc(doc(db, "products", id));
  if (docSnap.exists()) {
    const productData = docSnap.data();
    
    // Get variations if product is variable
    let variations: ProductVariation[] = [];
    if (productData.productType === "variable") {
      const variationsSnapshot = await getDocs(
        collection(db, "products", id, "variations")
      );
      variations = variationsSnapshot.docs.map((varDoc) => ({
        id: varDoc.id,
        ...varDoc.data(),
      })) as ProductVariation[];
    }

    return {
      id: docSnap.id,
      ...productData,
      createdAt: productData.createdAt?.toDate() || new Date(),
      variations: variations.length > 0 ? variations : undefined,
    } as Product;
  }
  return null;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const q = query(collection(db, "products"), where("slug", "==", slug));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const docSnapshot = querySnapshot.docs[0];
    const productData = docSnapshot.data();
    
    // Get variations if product is variable
    let variations: ProductVariation[] = [];
    if (productData.productType === "variable") {
      const variationsSnapshot = await getDocs(
        collection(db, "products", docSnapshot.id, "variations")
      );
      variations = variationsSnapshot.docs.map((varDoc) => ({
        id: varDoc.id,
        ...varDoc.data(),
      })) as ProductVariation[];
    }

    return {
      id: docSnapshot.id,
      ...productData,
      createdAt: productData.createdAt?.toDate() || new Date(),
      variations: variations.length > 0 ? variations : undefined,
    } as Product;
  }
  return null;
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const q = query(
    collection(db, "products"),
    where("categoryId", "==", categoryId),
    where("status", "==", "active")
  );
  const querySnapshot = await getDocs(q);
  
  const products = await Promise.all(
    querySnapshot.docs.map(async (docSnapshot) => {
      const productData = docSnapshot.data();
      
      // Get variations if product is variable
      let variations: ProductVariation[] = [];
      if (productData.productType === "variable") {
        const variationsSnapshot = await getDocs(
          collection(db, "products", docSnapshot.id, "variations")
        );
        variations = variationsSnapshot.docs.map((varDoc) => ({
          id: varDoc.id,
          ...varDoc.data(),
        })) as ProductVariation[];
      }

      return {
        id: docSnapshot.id,
        ...productData,
        createdAt: productData.createdAt?.toDate() || new Date(),
        variations: variations.length > 0 ? variations : undefined,
      } as Product;
    })
  );

  return products;
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  // Get all active products and filter client-side
  // Note: For production, use Algolia or similar for better search
  const products = await getProducts("active");
  
  const lowerSearch = searchTerm.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerSearch) ||
      product.sku?.toLowerCase().includes(lowerSearch) ||
      product.brand?.toLowerCase().includes(lowerSearch) ||
      product.tags.some((tag) => tag.toLowerCase().includes(lowerSearch))
  );
};

export const createProduct = async (
  productData: Omit<Product, "id" | "createdAt">,
  variations?: ProductVariation[]
) => {
  const { variations: _, ...dataWithoutVariations } = productData as any;
  
  const docRef = await addDoc(collection(db, "products"), {
    ...dataWithoutVariations,
    createdAt: serverTimestamp(),
  });

  // Add variations if product is variable
  if (productData.productType === "variable" && variations) {
    for (const variation of variations) {
      const { id, ...variationData } = variation;
      await addDoc(
        collection(db, "products", docRef.id, "variations"),
        variationData
      );
    }
  }

  return docRef.id;
};

export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
  variations?: ProductVariation[]
) => {
  const { variations: _, createdAt, ...dataWithoutVariations } = productData as any;
  
  await updateDoc(doc(db, "products", id), dataWithoutVariations);

  // Update variations if provided
  if (productData.productType === "variable" && variations) {
    // Delete existing variations
    const existingVariations = await getDocs(
      collection(db, "products", id, "variations")
    );
    for (const varDoc of existingVariations.docs) {
      await deleteDoc(varDoc.ref);
    }

    // Add new variations
    for (const variation of variations) {
      const { id: varId, ...variationData } = variation;
      if (varId && varId.startsWith("existing-")) {
        // Update existing
        await setDoc(
          doc(db, "products", id, "variations", varId.replace("existing-", "")),
          variationData
        );
      } else {
        // Create new
        await addDoc(
          collection(db, "products", id, "variations"),
          variationData
        );
      }
    }
  }
};

export const deleteProduct = async (id: string) => {
  // Delete variations first
  const variationsSnapshot = await getDocs(
    collection(db, "products", id, "variations")
  );
  for (const varDoc of variationsSnapshot.docs) {
    await deleteDoc(varDoc.ref);
  }
  
  // Delete product
  await deleteDoc(doc(db, "products", id));
};

// Orders
export const createOrder = async (orderData: Omit<Order, "id" | "createdAt">) => {
  const docRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getOrders = async (customerUid?: string): Promise<Order[]> => {
  let querySnapshot;
  
  if (customerUid) {
    // Query for specific customer - requires index
    try {
      const q = query(
        collection(db, "orders"),
        where("customerUid", "==", customerUid),
        orderBy("createdAt", "desc")
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // Fallback: query without orderBy if index doesn't exist yet
      if (error.code === 'failed-precondition') {
        console.info(
          '📊 Firestore Index Recommended (Optional)',
          '\n✅ App is working normally with client-side sorting',
          '\n⚡ Create index for better performance:',
          '\n   1. Click this link in the error details above',
          '\n   2. Click "Create Index" in Firebase Console',
          '\n   3. Wait 1-2 minutes',
          '\n\n💡 This warning is safe to ignore for now.'
        );
      }
      
      const q = query(
        collection(db, "orders"),
        where("customerUid", "==", customerUid)
      );
      querySnapshot = await getDocs(q);
      
      // Sort client-side
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Order[];
      
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } else {
    // Query all orders (admin)
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // Fallback: fetch all without orderBy
      if (error.code === 'failed-precondition') {
        console.info(
          '📊 Firestore Index Recommended (Optional)',
          '\n✅ App is working normally with client-side sorting',
          '\n⚡ Create index for better performance:',
          '\n   1. Click this link in the error details above',
          '\n   2. Click "Create Index" in Firebase Console',
          '\n   3. Wait 1-2 minutes',
          '\n\n💡 This warning is safe to ignore for now.'
        );
      }
      
      querySnapshot = await getDocs(collection(db, "orders"));
      
      // Sort client-side
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Order[];
      
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Order[];
};

export const getOrder = async (id: string): Promise<Order | null> => {
  const docSnap = await getDoc(doc(db, "orders", id));
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    } as Order;
  }
  return null;
};

export const updateOrderStatus = async (
  id: string,
  status: Order["status"]
) => {
  await updateDoc(doc(db, "orders", id), { status });
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as User[];
};

export const updateUserRole = async (uid: string, role: "customer" | "admin") => {
  await updateDoc(doc(db, "users", uid), { role });
};

export const getUser = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (docSnap.exists()) {
    return {
      uid: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    } as User;
  }
  return null;
};

// System Settings
const SETTINGS_DOC_ID = "app-settings";

export const getSettings = async (): Promise<SystemSettings | null> => {
  const docSnap = await getDoc(doc(db, "settings", SETTINGS_DOC_ID));
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SystemSettings;
  }
  // Return default settings if not found
  return {
    id: SETTINGS_DOC_ID,
    companyName: "ANUSHAKTI INFOTECH PVT. LTD.",
    companyAddress: "E-317, Siddhraj Z-Square, Podar International School Road, Kudasan, Gandhinagar, Gujarat - 382421, India",
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
  };
};

export const updateSettings = async (settings: Partial<SystemSettings>) => {
  const { id, ...settingsData } = settings;
  await setDoc(doc(db, "settings", SETTINGS_DOC_ID), settingsData, { merge: true });
};
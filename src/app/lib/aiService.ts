import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AISettings, 
  AITask, 
  ProductDraft, 
  AIConversation, 
  AIUsage 
} from './types';

// ==================== AI SETTINGS ====================

export async function getAISettings(adminId: string): Promise<AISettings | null> {
  try {
    const docRef = doc(db, 'aiSettings', adminId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AISettings;
    }
    return null;
  } catch (error) {
    console.error('Error getting AI settings:', error);
    throw error;
  }
}

export async function saveAISettings(adminId: string, settings: Partial<AISettings>): Promise<void> {
  try {
    const docRef = doc(db, 'aiSettings', adminId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      await updateDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: adminId,
        model: 'gpt-4-vision-preview',
        maxTokensPerRequest: 4000,
        monthlyBudgetINR: 5000,
        enableCostNotifications: true,
        automationLevel: 'semi-auto',
        autoSuggestCategories: true,
        allowCreateCategories: true,
        categoryConfidenceThreshold: 0.7,
        customInstructions: [],
        ...settings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving AI settings:', error);
    throw error;
  }
}

// ==================== AI TASKS ====================

export async function createAITask(
  adminId: string, 
  input: AITask['input']
): Promise<string> {
  try {
    const taskRef = await addDoc(collection(db, 'aiTasks'), {
      adminId,
      status: 'pending',
      stage: 'analyzing_input',
      progress: 0,
      input,
      metadata: {
        model: '',
        tokensUsed: 0,
        cost: 0,
        duration: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return taskRef.id;
  } catch (error) {
    console.error('Error creating AI task:', error);
    throw error;
  }
}

export async function getAITask(taskId: string): Promise<AITask | null> {
  try {
    const docRef = doc(db, 'aiTasks', taskId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AITask;
    }
    return null;
  } catch (error) {
    console.error('Error getting AI task:', error);
    throw error;
  }
}

export async function updateAITask(
  taskId: string, 
  updates: Partial<Omit<AITask, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'aiTasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating AI task:', error);
    throw error;
  }
}

export async function getAdminTasks(adminId: string): Promise<AITask[]> {
  try {
    const q = query(
      collection(db, 'aiTasks'),
      where('adminId', '==', adminId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as AITask[];
  } catch (error) {
    console.error('Error getting admin tasks:', error);
    throw error;
  }
}

// ==================== PRODUCT DRAFTS ====================

export async function createProductDraft(draft: Omit<ProductDraft, 'id' | 'createdAt'>): Promise<string> {
  try {
    const draftRef = await addDoc(collection(db, 'productDrafts'), {
      ...draft,
      createdAt: serverTimestamp(),
    });
    
    return draftRef.id;
  } catch (error) {
    console.error('Error creating product draft:', error);
    throw error;
  }
}

export async function getProductDraft(draftId: string): Promise<ProductDraft | null> {
  try {
    const docRef = doc(db, 'productDrafts', draftId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        publishedAt: data.publishedAt?.toDate(),
        adminChanges: data.adminChanges?.map((change: any) => ({
          ...change,
          timestamp: change.timestamp?.toDate(),
        })),
      } as ProductDraft;
    }
    return null;
  } catch (error) {
    console.error('Error getting product draft:', error);
    throw error;
  }
}

export async function updateProductDraft(
  draftId: string, 
  updates: Partial<Omit<ProductDraft, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'productDrafts', draftId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating product draft:', error);
    throw error;
  }
}

export async function getAdminDrafts(adminId: string): Promise<ProductDraft[]> {
  try {
    const q = query(
      collection(db, 'productDrafts'),
      where('adminId', '==', adminId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      publishedAt: doc.data().publishedAt?.toDate(),
      adminChanges: doc.data().adminChanges?.map((change: any) => ({
        ...change,
        timestamp: change.timestamp?.toDate(),
      })),
    })) as ProductDraft[];
  } catch (error) {
    console.error('Error getting admin drafts:', error);
    throw error;
  }
}

// ==================== AI CONVERSATIONS ====================

export async function createAIConversation(adminId: string): Promise<string> {
  try {
    const convRef = await addDoc(collection(db, 'aiConversations'), {
      adminId,
      messages: [],
      context: {
        mode: 'idle',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return convRef.id;
  } catch (error) {
    console.error('Error creating AI conversation:', error);
    throw error;
  }
}

export async function getAIConversation(conversationId: string): Promise<AIConversation | null> {
  try {
    const docRef = doc(db, 'aiConversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate(),
        })),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AIConversation;
    }
    return null;
  } catch (error) {
    console.error('Error getting AI conversation:', error);
    throw error;
  }
}

export async function getAdminConversation(adminId: string): Promise<AIConversation | null> {
  try {
    const q = query(
      collection(db, 'aiConversations'),
      where('adminId', '==', adminId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      messages: data.messages?.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate(),
      })),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as AIConversation;
  } catch (error) {
    console.error('Error getting admin conversation:', error);
    throw error;
  }
}

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<AIConversation['messages'][0], 'id' | 'timestamp'>
): Promise<void> {
  try {
    const docRef = doc(db, 'aiConversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const messages = data.messages || [];
      
      await updateDoc(docRef, {
        messages: [
          ...messages,
          {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...message,
            timestamp: Timestamp.now(),
          },
        ],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    throw error;
  }
}

export async function updateConversationContext(
  conversationId: string,
  context: Partial<AIConversation['context']>
): Promise<void> {
  try {
    const docRef = doc(db, 'aiConversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      await updateDoc(docRef, {
        context: {
          ...data.context,
          ...context,
        },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating conversation context:', error);
    throw error;
  }
}

// ==================== AI USAGE TRACKING ====================

export async function getAIUsage(adminId: string, month: string): Promise<AIUsage | null> {
  try {
    const usageId = `${adminId}-${month}`;
    const docRef = doc(db, 'aiUsage', usageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate(),
      } as AIUsage;
    }
    return null;
  } catch (error) {
    console.error('Error getting AI usage:', error);
    throw error;
  }
}

export async function updateAIUsage(
  adminId: string,
  model: string,
  tokens: number,
  cost: number
): Promise<void> {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const usageId = `${adminId}-${month}`;
    
    const docRef = doc(db, 'aiUsage', usageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const byModel = data.byModel || {};
      const dailyBreakdown = data.dailyBreakdown || {};
      
      const modelStats = byModel[model] || { requests: 0, tokens: 0, cost: 0 };
      const todayStats = dailyBreakdown[today] || { requests: 0, cost: 0 };
      
      await updateDoc(docRef, {
        totalRequests: (data.totalRequests || 0) + 1,
        totalTokens: (data.totalTokens || 0) + tokens,
        totalCost: (data.totalCost || 0) + cost,
        requestsToday: (data.requestsToday || 0) + 1,
        costToday: (data.costToday || 0) + cost,
        byModel: {
          ...byModel,
          [model]: {
            requests: modelStats.requests + 1,
            tokens: modelStats.tokens + tokens,
            cost: modelStats.cost + cost,
          },
        },
        dailyBreakdown: {
          ...dailyBreakdown,
          [today]: {
            requests: todayStats.requests + 1,
            cost: todayStats.cost + cost,
          },
        },
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: usageId,
        adminId,
        month,
        totalRequests: 1,
        totalTokens: tokens,
        totalCost: cost,
        requestsToday: 1,
        costToday: cost,
        byModel: {
          [model]: {
            requests: 1,
            tokens,
            cost,
          },
        },
        dailyBreakdown: {
          [today]: {
            requests: 1,
            cost,
          },
        },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating AI usage:', error);
    throw error;
  }
}

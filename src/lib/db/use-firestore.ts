import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuthStore } from '../store/auth-store';

type Document = Record<string, any>;
type CollectionHookResult<T> = {
  documents: T[];
  isLoading: boolean;
  error: string | null;
  add: (data: Omit<T, 'id'>) => Promise<void>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Promise<T | null>;
};

// Custom hook for working with a specific Firestore collection
export function useCollection<T extends Document>(collectionName: string): CollectionHookResult<T> {
  const [documents, setDocuments] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore.useUser();

  // Fetch collection data
  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    const subscriber = firestore()
      .collection(collectionName)
      .where('userId', '==', user.uid)
      .onSnapshot(
        (snapshot) => {
          const fetchedDocuments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as T[];
          
          setDocuments(fetchedDocuments);
          setIsLoading(false);
        },
        (err) => {
          setError(`Failed to fetch ${collectionName}: ${err.message}`);
          setIsLoading(false);
        }
      );

    // Unsubscribe from events when no longer in use
    return () => subscriber();
  }, [collectionName, user]);

  // Add a document to the collection
  const add = async (data: Omit<T, 'id'>) => {
    if (!user) {
      setError('User must be authenticated to add documents');
      return;
    }

    try {
      setIsLoading(true);
      await firestore().collection(collectionName).add({
        ...data,
        userId: user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to add document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Update a document
  const update = async (id: string, data: Partial<T>) => {
    if (!user) {
      setError('User must be authenticated to update documents');
      return;
    }

    try {
      setIsLoading(true);
      await firestore().collection(collectionName).doc(id).update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to update document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Remove a document
  const remove = async (id: string) => {
    if (!user) {
      setError('User must be authenticated to remove documents');
      return;
    }

    try {
      setIsLoading(true);
      await firestore().collection(collectionName).doc(id).delete();
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to remove document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Get a document by ID
  const getById = async (id: string): Promise<T | null> => {
    if (!user) {
      setError('User must be authenticated to fetch documents');
      return null;
    }

    try {
      setIsLoading(true);
      const doc = await firestore().collection(collectionName).doc(id).get();
      setIsLoading(false);
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() } as unknown as T;
    } catch (err) {
      setError(`Failed to get document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      return null;
    }
  };

  return { documents, isLoading, error, add, update, remove, getById };
} 
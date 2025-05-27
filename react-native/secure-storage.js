// Example of secure storage implementation in React Native

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Encryption key (in a real app, this would be stored more securely or derived)
const ENCRYPTION_KEY = 'YOUR_ENCRYPTION_KEY_SHOULD_BE_KEPT_SECURE';

// Check if secure storage is available
const isSecureStoreAvailable = async () => {
  return Platform.OS === 'web' ? false : await SecureStore.isAvailableAsync();
};

// Encrypt data before storing it
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

// Decrypt data after retrieval
const decryptData = (encryptedData) => {
  if (!encryptedData) return null;
  
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  try {
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Save data securely
export const saveSecureData = async (key, value) => {
  try {
    // Convert value to string if it's an object
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Check if SecureStore is available
    if (await isSecureStoreAvailable()) {
      // Use SecureStore if available
      await SecureStore.setItemAsync(key, valueToStore);
    } else {
      // Fallback to encrypted AsyncStorage
      const encryptedValue = encryptData(valueToStore);
      await AsyncStorage.setItem(key, encryptedValue);
    }
    return true;
  } catch (error) {
    console.error('Error saving secure data:', error);
    return false;
  }
};

// Get data securely
export const getSecureData = async (key) => {
  try {
    // Check if SecureStore is available
    if (await isSecureStoreAvailable()) {
      // Use SecureStore if available
      const result = await SecureStore.getItemAsync(key);
      if (!result) return null;
      
      // Parse JSON if the stored value is an object
      try {
        return JSON.parse(result);
      } catch {
        return result; // Return as is if not JSON
      }
    } else {
      // Fallback to encrypted AsyncStorage
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      
      const decryptedValue = decryptData(encryptedValue);
      
      // Parse JSON if the stored value is an object
      try {
        return JSON.parse(decryptedValue);
      } catch {
        return decryptedValue; // Return as is if not JSON
      }
    }
  } catch (error) {
    console.error('Error retrieving secure data:', error);
    return null;
  }
};

// Delete data securely
export const deleteSecureData = async (key) => {
  try {
    // Check if SecureStore is available
    if (await isSecureStoreAvailable()) {
      // Use SecureStore if available
      await SecureStore.deleteItemAsync(key);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error('Error deleting secure data:', error);
    return false;
  }
};

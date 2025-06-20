'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  Calculator, 
  Plus, 
  Minus, 
  Info,
  ChefHat,
  Apple,
  Beef,
  Milk,
  Wheat
} from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  caloriesPerGram: number;
  icon: string;
  color: string;
  amount?: number;
  unit?: string;
  caloriesPerUnit?: number;
}

interface CalorieCalculatorProps {
  onCalorieChange: (calories: number) => void;
  initialCalories?: number;
  className?: string;
}

// Genişletilmiş malzeme veritabanı - Türk mutfağı odaklı
const INGREDIENT_DATABASE: Ingredient[] = [
  // Et ve Protein Kaynakları
  { id: 'chicken-breast', name: 'Tavuk Göğsü', category: 'protein', caloriesPerGram: 1.65, icon: '🐔', color: 'bg-red-100 text-red-700' },
  { id: 'beef', name: 'Dana Eti', category: 'protein', caloriesPerGram: 2.5, icon: '🥩', color: 'bg-red-100 text-red-700' },
  { id: 'lamb', name: 'Kuzu Eti', category: 'protein', caloriesPerGram: 2.94, icon: '🐑', color: 'bg-red-100 text-red-700' },
  { id: 'ground-beef', name: 'Kıyma', category: 'protein', caloriesPerGram: 2.54, icon: '🥩', color: 'bg-red-100 text-red-700' },
  { id: 'chicken-thigh', name: 'Tavuk But', category: 'protein', caloriesPerGram: 2.09, icon: '🍗', color: 'bg-red-100 text-red-700' },
  { id: 'turkey', name: 'Hindi Eti', category: 'protein', caloriesPerGram: 1.89, icon: '🦃', color: 'bg-red-100 text-red-700' },
  { id: 'fish-sea-bass', name: 'Levrek', category: 'protein', caloriesPerGram: 1.24, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'fish-salmon', name: 'Somon', category: 'protein', caloriesPerGram: 2.08, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'fish-anchovy', name: 'Hamsi', category: 'protein', caloriesPerGram: 1.31, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'fish-sea-bream', name: 'Çupra', category: 'protein', caloriesPerGram: 1.28, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'fish-mackerel', name: 'Uskumru', category: 'protein', caloriesPerGram: 2.05, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'fish-tuna', name: 'Ton Balığı', category: 'protein', caloriesPerGram: 1.44, icon: '🐟', color: 'bg-blue-100 text-blue-700' },
  { id: 'shrimp', name: 'Karides', category: 'protein', caloriesPerGram: 0.99, icon: '🦐', color: 'bg-blue-100 text-blue-700' },
  { id: 'mussel', name: 'Midye', category: 'protein', caloriesPerGram: 0.86, icon: '🦪', color: 'bg-blue-100 text-blue-700' },
  { id: 'squid', name: 'Kalamar', category: 'protein', caloriesPerGram: 0.92, icon: '🦑', color: 'bg-blue-100 text-blue-700' },
  { id: 'egg', name: 'Yumurta', category: 'protein', caloriesPerGram: 1.55, icon: '🥚', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'sucuk', name: 'Sucuk', category: 'protein', caloriesPerGram: 4.73, icon: '🌭', color: 'bg-red-100 text-red-700' },
  { id: 'pastirma', name: 'Pastırma', category: 'protein', caloriesPerGram: 2.63, icon: '🥓', color: 'bg-red-100 text-red-700' },
  { id: 'sausage', name: 'Sosis', category: 'protein', caloriesPerGram: 3.01, icon: '🌭', color: 'bg-red-100 text-red-700' },

  // Baklagiller
  { id: 'chickpeas', name: 'Nohut (Pişmiş)', category: 'protein', caloriesPerGram: 1.64, icon: '🟤', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'lentils-red', name: 'Kırmızı Mercimek (Pişmiş)', category: 'protein', caloriesPerGram: 1.16, icon: '🔴', color: 'bg-red-100 text-red-700' },
  { id: 'lentils-green', name: 'Yeşil Mercimek (Pişmiş)', category: 'protein', caloriesPerGram: 1.16, icon: '🟢', color: 'bg-green-100 text-green-700' },
  { id: 'beans-white', name: 'Fasulye (Pişmiş)', category: 'protein', caloriesPerGram: 1.27, icon: '🤍', color: 'bg-white-100 text-white-700' },
  { id: 'beans-black', name: 'Barbunya (Pişmiş)', category: 'protein', caloriesPerGram: 1.32, icon: '🔴', color: 'bg-red-100 text-red-700' },
  { id: 'beans-kidney', name: 'Börülce (Pişmiş)', category: 'protein', caloriesPerGram: 1.16, icon: '🟤', color: 'bg-brown-100 text-brown-700' },

  // Karbonhidratlar
  { id: 'rice', name: 'Pirinç (Pişmiş)', category: 'carbs', caloriesPerGram: 1.3, icon: '🍚', color: 'bg-amber-100 text-amber-700' },
  { id: 'bulgur', name: 'Bulgur (Pişmiş)', category: 'carbs', caloriesPerGram: 0.83, icon: '🌾', color: 'bg-amber-100 text-amber-700' },
  { id: 'bread', name: 'Ekmek', category: 'carbs', caloriesPerGram: 2.65, icon: '🍞', color: 'bg-amber-100 text-amber-700' },
  { id: 'bread-whole-wheat', name: 'Tam Buğday Ekmeği', category: 'carbs', caloriesPerGram: 2.47, icon: '🍞', color: 'bg-amber-100 text-amber-700' },
  { id: 'pasta', name: 'Makarna (Pişmiş)', category: 'carbs', caloriesPerGram: 1.31, icon: '🍝', color: 'bg-amber-100 text-amber-700' },
  { id: 'potato', name: 'Patates', category: 'carbs', caloriesPerGram: 0.77, icon: '🥔', color: 'bg-amber-100 text-amber-700' },
  { id: 'french-fries', name: 'Patates Kızartması', category: 'carbs', caloriesPerGram: 3.65, icon: '🍟', color: 'bg-amber-100 text-amber-700' },
  { id: 'pide-dough', name: 'Pide Hamuru', category: 'carbs', caloriesPerGram: 2.71, icon: '🥖', color: 'bg-amber-100 text-amber-700' },
  { id: 'lavash', name: 'Lavaş', category: 'carbs', caloriesPerGram: 2.75, icon: '🫓', color: 'bg-amber-100 text-amber-700' },
  { id: 'phyllo-dough', name: 'Yufka', category: 'carbs', caloriesPerGram: 3.01, icon: '📜', color: 'bg-amber-100 text-amber-700' },
  { id: 'corn', name: 'Mısır', category: 'carbs', caloriesPerGram: 0.86, icon: '🌽', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'quinoa', name: 'Kinoa (Pişmiş)', category: 'carbs', caloriesPerGram: 1.20, icon: '🌾', color: 'bg-amber-100 text-amber-700' },
  { id: 'oats', name: 'Yulaf (Pişmiş)', category: 'carbs', caloriesPerGram: 0.68, icon: '🌾', color: 'bg-amber-100 text-amber-700' },

  // Yağlar ve Soslar
  { id: 'olive-oil', name: 'Zeytinyağı', category: 'fat', caloriesPerGram: 8.84, icon: '🫒', color: 'bg-green-100 text-green-700' },
  { id: 'sunflower-oil', name: 'Ayçiçek Yağı', category: 'fat', caloriesPerGram: 8.84, icon: '🌻', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'corn-oil', name: 'Mısır Yağı', category: 'fat', caloriesPerGram: 8.84, icon: '🌽', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'hazelnut-oil', name: 'Fındık Yağı', category: 'fat', caloriesPerGram: 8.84, icon: '🌰', color: 'bg-brown-100 text-brown-700' },
  { id: 'butter', name: 'Tereyağı', category: 'fat', caloriesPerGram: 7.17, icon: '🧈', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'margarine', name: 'Margarin', category: 'fat', caloriesPerGram: 7.17, icon: '🧈', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'tahini', name: 'Tahin', category: 'fat', caloriesPerGram: 5.95, icon: '🥜', color: 'bg-brown-100 text-brown-700' },
  { id: 'nuts-walnut', name: 'Ceviz', category: 'fat', caloriesPerGram: 6.54, icon: '🌰', color: 'bg-brown-100 text-brown-700' },
  { id: 'nuts-hazelnut', name: 'Fındık', category: 'fat', caloriesPerGram: 6.28, icon: '🌰', color: 'bg-brown-100 text-brown-700' },
  { id: 'nuts-almond', name: 'Badem', category: 'fat', caloriesPerGram: 5.79, icon: '🌰', color: 'bg-brown-100 text-brown-700' },
  { id: 'nuts-pistachio', name: 'Antep Fıstığı', category: 'fat', caloriesPerGram: 5.60, icon: '🥜', color: 'bg-green-100 text-green-700' },
  { id: 'nuts-peanut', name: 'Yer Fıstığı', category: 'fat', caloriesPerGram: 5.67, icon: '🥜', color: 'bg-brown-100 text-brown-700' },
  { id: 'sesame', name: 'Susam', category: 'fat', caloriesPerGram: 5.73, icon: '🌰', color: 'bg-brown-100 text-brown-700' },
  { id: 'sunflower-seeds', name: 'Ayçiçek Çekirdeği', category: 'fat', caloriesPerGram: 5.84, icon: '🌻', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'pumpkin-seeds', name: 'Kabak Çekirdeği', category: 'fat', caloriesPerGram: 5.59, icon: '🎃', color: 'bg-orange-100 text-orange-700' },

  // Sebzeler
  { id: 'tomato', name: 'Domates', category: 'vegetables', caloriesPerGram: 0.18, icon: '🍅', color: 'bg-red-100 text-red-700' },
  { id: 'onion', name: 'Soğan', category: 'vegetables', caloriesPerGram: 0.40, icon: '🧅', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'red-onion', name: 'Kırmızı Soğan', category: 'vegetables', caloriesPerGram: 0.40, icon: '🧅', color: 'bg-red-100 text-red-700' },
  { id: 'green-onion', name: 'Yeşil Soğan', category: 'vegetables', caloriesPerGram: 0.32, icon: '🧅', color: 'bg-green-100 text-green-700' },
  { id: 'pepper-green', name: 'Yeşil Biber', category: 'vegetables', caloriesPerGram: 0.20, icon: '🫑', color: 'bg-green-100 text-green-700' },
  { id: 'pepper-red', name: 'Kırmızı Biber', category: 'vegetables', caloriesPerGram: 0.31, icon: '🌶️', color: 'bg-red-100 text-red-700' },
  { id: 'pepper-yellow', name: 'Sarı Biber', category: 'vegetables', caloriesPerGram: 0.27, icon: '🫑', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'hot-pepper', name: 'Acı Biber', category: 'vegetables', caloriesPerGram: 0.40, icon: '🌶️', color: 'bg-red-100 text-red-700' },
  { id: 'eggplant', name: 'Patlıcan', category: 'vegetables', caloriesPerGram: 0.25, icon: '🍆', color: 'bg-purple-100 text-purple-700' },
  { id: 'zucchini', name: 'Kabak', category: 'vegetables', caloriesPerGram: 0.17, icon: '🥒', color: 'bg-green-100 text-green-700' },
  { id: 'carrot', name: 'Havuç', category: 'vegetables', caloriesPerGram: 0.41, icon: '🥕', color: 'bg-orange-100 text-orange-700' },
  { id: 'spinach', name: 'Ispanak', category: 'vegetables', caloriesPerGram: 0.23, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'lettuce', name: 'Marul', category: 'vegetables', caloriesPerGram: 0.15, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'arugula', name: 'Roka', category: 'vegetables', caloriesPerGram: 0.25, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'cucumber', name: 'Salatalık', category: 'vegetables', caloriesPerGram: 0.16, icon: '🥒', color: 'bg-green-100 text-green-700' },
  { id: 'cabbage', name: 'Lahana', category: 'vegetables', caloriesPerGram: 0.25, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'cabbage-red', name: 'Kırmızı Lahana', category: 'vegetables', caloriesPerGram: 0.31, icon: '🥬', color: 'bg-red-100 text-red-700' },
  { id: 'cauliflower', name: 'Karnabahar', category: 'vegetables', caloriesPerGram: 0.25, icon: '🥬', color: 'bg-white-100 text-white-700' },
  { id: 'broccoli', name: 'Brokoli', category: 'vegetables', caloriesPerGram: 0.34, icon: '🥦', color: 'bg-green-100 text-green-700' },
  { id: 'leek', name: 'Pırasa', category: 'vegetables', caloriesPerGram: 0.61, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'celery', name: 'Kereviz', category: 'vegetables', caloriesPerGram: 0.16, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'artichoke', name: 'Enginar', category: 'vegetables', caloriesPerGram: 0.47, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'asparagus', name: 'Kuşkonmaz', category: 'vegetables', caloriesPerGram: 0.20, icon: '🥬', color: 'bg-green-100 text-green-700' },
  { id: 'beet', name: 'Pancar', category: 'vegetables', caloriesPerGram: 0.43, icon: '🥕', color: 'bg-red-100 text-red-700' },
  { id: 'radish', name: 'Turp', category: 'vegetables', caloriesPerGram: 0.16, icon: '🥕', color: 'bg-white-100 text-white-700' },
  { id: 'turnip', name: 'Şalgam', category: 'vegetables', caloriesPerGram: 0.28, icon: '🥕', color: 'bg-purple-100 text-purple-700' },
  { id: 'mushroom', name: 'Mantar', category: 'vegetables', caloriesPerGram: 0.22, icon: '🍄', color: 'bg-brown-100 text-brown-700' },
  { id: 'okra', name: 'Bamya', category: 'vegetables', caloriesPerGram: 0.33, icon: '🥒', color: 'bg-green-100 text-green-700' },

  // Süt Ürünleri
  { id: 'cheese-white', name: 'Beyaz Peynir', category: 'dairy', caloriesPerGram: 2.64, icon: '🧀', color: 'bg-blue-100 text-blue-700' },
  { id: 'cheese-kashar', name: 'Kaşar Peyniri', category: 'dairy', caloriesPerGram: 3.74, icon: '🧀', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'cheese-tulum', name: 'Tulum Peyniri', category: 'dairy', caloriesPerGram: 3.82, icon: '🧀', color: 'bg-green-100 text-green-700' },
  { id: 'cheese-cottage', name: 'Lor Peyniri', category: 'dairy', caloriesPerGram: 0.98, icon: '🧀', color: 'bg-white-100 text-white-700' },
  { id: 'cheese-feta', name: 'Ezine Peyniri', category: 'dairy', caloriesPerGram: 2.64, icon: '🧀', color: 'bg-blue-100 text-blue-700' },
  { id: 'cheese-mozzarella', name: 'Mozzarella', category: 'dairy', caloriesPerGram: 2.80, icon: '🧀', color: 'bg-white-100 text-white-700' },
  { id: 'cheese-cheddar', name: 'Çedar Peyniri', category: 'dairy', caloriesPerGram: 4.03, icon: '🧀', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'cheese-goat', name: 'Keçi Peyniri', category: 'dairy', caloriesPerGram: 3.64, icon: '🧀', color: 'bg-white-100 text-white-700' },
  { id: 'yogurt', name: 'Yoğurt', category: 'dairy', caloriesPerGram: 0.59, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'yogurt-greek', name: 'Süzme Yoğurt', category: 'dairy', caloriesPerGram: 0.59, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'milk', name: 'Süt', category: 'dairy', caloriesPerGram: 0.42, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'milk-low-fat', name: 'Yağsız Süt', category: 'dairy', caloriesPerGram: 0.35, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'cream', name: 'Krema', category: 'dairy', caloriesPerGram: 3.45, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'sour-cream', name: 'Ekşi Krema', category: 'dairy', caloriesPerGram: 1.93, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'ayran', name: 'Ayran', category: 'dairy', caloriesPerGram: 0.20, icon: '🥛', color: 'bg-blue-100 text-blue-700' },
  { id: 'kefir', name: 'Kefir', category: 'dairy', caloriesPerGram: 0.41, icon: '🥛', color: 'bg-blue-100 text-blue-700' },

  // Baharatlar ve Aromalar
  { id: 'salt', name: 'Tuz', category: 'other', caloriesPerGram: 0, icon: '🧂', color: 'bg-gray-100 text-gray-700' },
  { id: 'black-pepper', name: 'Karabiber', category: 'other', caloriesPerGram: 2.51, icon: '🌶️', color: 'bg-gray-100 text-gray-700' },
  { id: 'red-pepper-flakes', name: 'Kırmızı Pul Biber', category: 'other', caloriesPerGram: 2.82, icon: '🌶️', color: 'bg-red-100 text-red-700' },
  { id: 'paprika', name: 'Toz Biber', category: 'other', caloriesPerGram: 2.82, icon: '🌶️', color: 'bg-red-100 text-red-700' },
  { id: 'cumin', name: 'Kimyon', category: 'other', caloriesPerGram: 3.75, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'oregano', name: 'Kekik', category: 'other', caloriesPerGram: 2.65, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'parsley', name: 'Maydanoz', category: 'other', caloriesPerGram: 0.36, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'dill', name: 'Dereotu', category: 'other', caloriesPerGram: 0.43, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'mint', name: 'Nane', category: 'other', caloriesPerGram: 0.70, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'basil', name: 'Fesleğen', category: 'other', caloriesPerGram: 0.22, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'thyme', name: 'Kekik (Taze)', category: 'other', caloriesPerGram: 1.01, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'rosemary', name: 'Biberiye', category: 'other', caloriesPerGram: 1.31, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'bay-leaves', name: 'Defne Yaprağı', category: 'other', caloriesPerGram: 3.13, icon: '🍃', color: 'bg-green-100 text-green-700' },
  { id: 'garlic', name: 'Sarımsak', category: 'other', caloriesPerGram: 1.49, icon: '🧄', color: 'bg-white-100 text-white-700' },
  { id: 'ginger', name: 'Zencefil', category: 'other', caloriesPerGram: 0.80, icon: '🫚', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'cinnamon', name: 'Tarçın', category: 'other', caloriesPerGram: 2.47, icon: '🌿', color: 'bg-brown-100 text-brown-700' },
  { id: 'turmeric', name: 'Zerdeçal', category: 'other', caloriesPerGram: 3.54, icon: '🌿', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'coriander', name: 'Kişniş', category: 'other', caloriesPerGram: 2.98, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'cardamom', name: 'Kakule', category: 'other', caloriesPerGram: 3.11, icon: '🌿', color: 'bg-green-100 text-green-700' },
  { id: 'allspice', name: 'Yenibahar', category: 'other', caloriesPerGram: 2.63, icon: '🌿', color: 'bg-brown-100 text-brown-700' },
  { id: 'sumac', name: 'Sumak', category: 'other', caloriesPerGram: 3.79, icon: '🌿', color: 'bg-red-100 text-red-700' },

  // Meyveler
  { id: 'lemon', name: 'Limon', category: 'other', caloriesPerGram: 0.29, icon: '🍋', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'orange', name: 'Portakal', category: 'other', caloriesPerGram: 0.47, icon: '🍊', color: 'bg-orange-100 text-orange-700' },
  { id: 'pomegranate', name: 'Nar', category: 'other', caloriesPerGram: 0.83, icon: '🍇', color: 'bg-red-100 text-red-700' },
  { id: 'apple', name: 'Elma', category: 'other', caloriesPerGram: 0.52, icon: '🍎', color: 'bg-red-100 text-red-700' },
  { id: 'grape', name: 'Üzüm', category: 'other', caloriesPerGram: 0.67, icon: '🍇', color: 'bg-purple-100 text-purple-700' },
  { id: 'banana', name: 'Muz', category: 'other', caloriesPerGram: 0.89, icon: '🍌', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'strawberry', name: 'Çilek', category: 'other', caloriesPerGram: 0.32, icon: '🍓', color: 'bg-red-100 text-red-700' },
  { id: 'cherry', name: 'Kiraz', category: 'other', caloriesPerGram: 0.63, icon: '🍒', color: 'bg-red-100 text-red-700' },
  { id: 'apricot', name: 'Kayısı', category: 'other', caloriesPerGram: 0.48, icon: '🍑', color: 'bg-orange-100 text-orange-700' },
  { id: 'peach', name: 'Şeftali', category: 'other', caloriesPerGram: 0.39, icon: '🍑', color: 'bg-orange-100 text-orange-700' },
  { id: 'plum', name: 'Erik', category: 'other', caloriesPerGram: 0.46, icon: '🟣', color: 'bg-purple-100 text-purple-700' },
  { id: 'pear', name: 'Armut', category: 'other', caloriesPerGram: 0.57, icon: '🍐', color: 'bg-green-100 text-green-700' },
  { id: 'fig', name: 'İncir', category: 'other', caloriesPerGram: 0.74, icon: '🫐', color: 'bg-purple-100 text-purple-700' },
  { id: 'watermelon', name: 'Karpuz', category: 'other', caloriesPerGram: 0.30, icon: '🍉', color: 'bg-red-100 text-red-700' },
  { id: 'melon', name: 'Kavun', category: 'other', caloriesPerGram: 0.34, icon: '🍈', color: 'bg-orange-100 text-orange-700' },

  // Soslar ve Konserveler
  { id: 'tomato-paste', name: 'Domates Salçası', category: 'other', caloriesPerGram: 0.82, icon: '🥫', color: 'bg-red-100 text-red-700' },
  { id: 'pepper-paste', name: 'Biber Salçası', category: 'other', caloriesPerGram: 0.71, icon: '🥫', color: 'bg-red-100 text-red-700' },
  { id: 'tomato-sauce', name: 'Domates Sosu', category: 'other', caloriesPerGram: 0.29, icon: '🥫', color: 'bg-red-100 text-red-700' },
  { id: 'olive-black', name: 'Siyah Zeytin', category: 'other', caloriesPerGram: 1.15, icon: '🫒', color: 'bg-green-100 text-green-700' },
  { id: 'olive-green', name: 'Yeşil Zeytin', category: 'other', caloriesPerGram: 1.45, icon: '🫒', color: 'bg-green-100 text-green-700' },
  { id: 'pickle', name: 'Turşu', category: 'other', caloriesPerGram: 0.11, icon: '🥒', color: 'bg-green-100 text-green-700' },
  { id: 'vinegar', name: 'Sirke', category: 'other', caloriesPerGram: 0.18, icon: '🍶', color: 'bg-gray-100 text-gray-700' },
  { id: 'soy-sauce', name: 'Soya Sosu', category: 'other', caloriesPerGram: 0.60, icon: '🍶', color: 'bg-brown-100 text-brown-700' },
  { id: 'worcestershire', name: 'İngiliz Sosu', category: 'other', caloriesPerGram: 0.78, icon: '🍶', color: 'bg-brown-100 text-brown-700' },
  { id: 'hot-sauce', name: 'Acı Sos', category: 'other', caloriesPerGram: 0.12, icon: '🌶️', color: 'bg-red-100 text-red-700' },
  { id: 'mayonnaise', name: 'Mayonez', category: 'other', caloriesPerGram: 6.80, icon: '🥄', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'ketchup', name: 'Ketçap', category: 'other', caloriesPerGram: 1.12, icon: '🥄', color: 'bg-red-100 text-red-700' },
  { id: 'mustard', name: 'Hardal', category: 'other', caloriesPerGram: 0.66, icon: '🥄', color: 'bg-yellow-100 text-yellow-700' },

  // Tatlılar ve Şeker
  { id: 'sugar', name: 'Şeker', category: 'other', caloriesPerGram: 3.87, icon: '🍯', color: 'bg-white-100 text-white-700' },
  { id: 'brown-sugar', name: 'Esmer Şeker', category: 'other', caloriesPerGram: 3.77, icon: '🍯', color: 'bg-brown-100 text-brown-700' },
  { id: 'honey', name: 'Bal', category: 'other', caloriesPerGram: 3.04, icon: '🍯', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'molasses', name: 'Pekmez', category: 'other', caloriesPerGram: 2.66, icon: '🍯', color: 'bg-brown-100 text-brown-700' },
  { id: 'jam', name: 'Reçel', category: 'other', caloriesPerGram: 2.78, icon: '🍓', color: 'bg-red-100 text-red-700' },
  { id: 'maple-syrup', name: 'Akçaağaç Şurubu', category: 'other', caloriesPerGram: 2.60, icon: '🍯', color: 'bg-brown-100 text-brown-700' },
  { id: 'chocolate-dark', name: 'Bitter Çikolata', category: 'other', caloriesPerGram: 5.46, icon: '🍫', color: 'bg-brown-100 text-brown-700' },
  { id: 'chocolate-milk', name: 'Sütlü Çikolata', category: 'other', caloriesPerGram: 5.35, icon: '🍫', color: 'bg-brown-100 text-brown-700' },
  { id: 'cocoa-powder', name: 'Kakao Tozu', category: 'other', caloriesPerGram: 2.28, icon: '🍫', color: 'bg-brown-100 text-brown-700' },

  // İçecekler
  { id: 'tea', name: 'Çay', category: 'other', caloriesPerGram: 0.01, icon: '🫖', color: 'bg-brown-100 text-brown-700' },
  { id: 'coffee', name: 'Kahve', category: 'other', caloriesPerGram: 0.02, icon: '☕', color: 'bg-brown-100 text-brown-700' },
  { id: 'turkish-coffee', name: 'Türk Kahvesi', category: 'other', caloriesPerGram: 0.02, icon: '☕', color: 'bg-brown-100 text-brown-700' },
  { id: 'water', name: 'Su', category: 'other', caloriesPerGram: 0, icon: '💧', color: 'bg-blue-100 text-blue-700' },
  { id: 'sparkling-water', name: 'Maden Suyu', category: 'other', caloriesPerGram: 0, icon: '💧', color: 'bg-blue-100 text-blue-700' },
  { id: 'lemonade', name: 'Limonata', category: 'other', caloriesPerGram: 0.40, icon: '🍋', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'orange-juice', name: 'Portakal Suyu', category: 'other', caloriesPerGram: 0.45, icon: '🍊', color: 'bg-orange-100 text-orange-700' },
  { id: 'apple-juice', name: 'Elma Suyu', category: 'other', caloriesPerGram: 0.46, icon: '🍎', color: 'bg-red-100 text-red-700' },
  { id: 'pomegranate-juice', name: 'Nar Suyu', category: 'other', caloriesPerGram: 0.54, icon: '🍇', color: 'bg-red-100 text-red-700' },
  { id: 'turnip-juice', name: 'Şalgam Suyu', category: 'other', caloriesPerGram: 0.14, icon: '🥕', color: 'bg-purple-100 text-purple-700' }
];

export default function CalorieCalculator({ onCalorieChange, initialCalories = 0, className = '' }: CalorieCalculatorProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [manualCalories, setManualCalories] = useState<number>(initialCalories);
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto');
  const [showIngredients, setShowIngredients] = useState(false);

  // Toplam kaloriyi hesapla
  const calculateTotalCalories = () => {
    return selectedIngredients.reduce((total, ingredient) => {
      const amount = ingredient.amount || 100;
      const caloriesPerUnit = ingredient.caloriesPerUnit || ingredient.caloriesPerGram;
      
      // Gram/ml bazında ise amount ile çarp, adet bazında ise direkt kullan
      if (ingredient.unit === 'gram' || ingredient.unit === 'ml') {
        return total + (caloriesPerUnit * amount);
      } else {
        return total + (caloriesPerUnit * amount);
      }
    }, 0);
  };

  const totalCalories = calculationMode === 'auto' ? Math.round(calculateTotalCalories()) : manualCalories;

  // Kalori değiştiğinde parent'ı bilgilendir
  React.useEffect(() => {
    onCalorieChange(totalCalories);
  }, [totalCalories, onCalorieChange]);

  // Manuel kalori değiştiğinde de parent'ı bilgilendir
  const handleManualCalorieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    setManualCalories(value);
  };

  // Malzeme ekle
  const addIngredient = (baseIngredient: Ingredient) => {
    const newIngredient = { 
      ...baseIngredient, 
      amount: 100,
      unit: 'gram',
      caloriesPerUnit: baseIngredient.caloriesPerGram
    };
    setSelectedIngredients([...selectedIngredients, newIngredient]);
  };

  // Malzeme çıkar
  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  // Malzeme miktarını güncelle
  const updateIngredientAmount = (index: number, newAmount: number) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], amount: Math.max(0, newAmount) };
    setSelectedIngredients(updated);
  };

  // Kategori ikonu
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein': return <Beef className="h-4 w-4" />;
      case 'carbs': return <Wheat className="h-4 w-4" />;
      case 'fat': return <div className="w-4 h-4 bg-yellow-500 rounded-full" />;
      case 'vegetable': return <Apple className="h-4 w-4" />;
      case 'dairy': return <Milk className="h-4 w-4" />;
      default: return <ChefHat className="h-4 w-4" />;
    }
  };

  // Kategori rengi
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'protein': return 'text-red-600 bg-red-100';
      case 'carbs': return 'text-yellow-600 bg-yellow-100';
      case 'fat': return 'text-orange-600 bg-orange-100';
      case 'vegetable': return 'text-green-600 bg-green-100';
      case 'dairy': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`calorie-calculator border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-medium text-gray-900">Kalori Hesaplayıcı</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-orange-600">{totalCalories}</span>
          <span className="text-sm text-gray-600">kcal</span>
        </div>
      </div>

      {/* Hesaplama Modu Seçimi */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setCalculationMode('auto')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            calculationMode === 'auto'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Calculator className="h-4 w-4 inline mr-1" />
          Otomatik
        </button>
        <button
          type="button"
          onClick={() => setCalculationMode('manual')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            calculationMode === 'manual'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Manuel
        </button>
      </div>

      {/* Manuel Mod */}
      {calculationMode === 'manual' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kalori Değeri
          </label>
          <input
            type="number"
            value={manualCalories}
            onChange={handleManualCalorieChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Kalori değeri girin..."
            min="0"
          />
        </div>
      )}

      {/* Otomatik Mod */}
      {calculationMode === 'auto' && (
        <div className="space-y-4">
          {/* Malzeme Listesi Göster/Gizle */}
          <button
            type="button"
            onClick={() => setShowIngredients(!showIngredients)}
            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            {showIngredients ? 'Malzeme Listesini Gizle' : 'Malzeme Ekle'}
          </button>

          {/* Seçili Malzemeler */}
          {selectedIngredients.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Seçili Malzemeler:</h4>
              {selectedIngredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <div className={`p-1 rounded ${getCategoryColor(ingredient.category)}`}>
                    {getCategoryIcon(ingredient.category)}
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{ingredient.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateIngredientAmount(index, (ingredient.amount || 100) - 10)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-gray-600 min-w-[40px] text-center">
                      {ingredient.amount || 100}{ingredient.unit === 'gram' ? 'g' : ingredient.unit === 'ml' ? 'ml' : 'adet'}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateIngredientAmount(index, (ingredient.amount || 100) + 10)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Çıkar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Malzeme Listesi */}
          {showIngredients && (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Yaygın Malzemeler:</h4>
              </div>
              <div className="p-2 space-y-1">
                {INGREDIENT_DATABASE.map((ingredient, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => addIngredient(ingredient)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm"
                  >
                    <div className={`p-1 rounded ${getCategoryColor(ingredient.category)}`}>
                      {getCategoryIcon(ingredient.category)}
                    </div>
                    <span className="flex-1">{ingredient.name}</span>
                    <span className="text-xs text-gray-500">
                      {ingredient.unit === 'adet' || ingredient.unit === 'çorba kaşığı' || ingredient.unit === 'çay kaşığı' 
                        ? `${ingredient.caloriesPerUnit || ingredient.caloriesPerGram} kcal/${ingredient.unit || 'adet'}`
                        : `${ingredient.caloriesPerUnit || ingredient.caloriesPerGram} kcal/g`
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bilgilendirme */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Kalori Hesaplama İpuçları:</p>
            <ul className="space-y-1">
              <li>• Otomatik mod malzemelere göre hesaplar</li>
              <li>• Manuel mod için beslenme rehberlerini kullanın</li>
              <li>• Pişirme yöntemi kaloriyi etkileyebilir</li>
              <li>• Miktarları değiştirerek kalorileri ayarlayabilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
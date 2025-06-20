import { CategoryService } from '@/services/categoryService';
import { RestaurantService } from '@/services/restaurantService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function seedDatabase() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');
  
  try {
    // Kategoriler
    const categories = [
      {
        name: 'Pizza',
        description: 'İtalyan usulü lezzetli pizzalar',
        icon: '🍕',
        color: '#FF6B35',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Burger',
        description: 'Sulu ve lezzetli burgerler',
        icon: '🍔',
        color: '#8B4513',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Döner',
        description: 'Geleneksel Türk döneri',
        icon: '🥙',
        color: '#DAA520',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Kebap',
        description: 'Mangalda pişmiş kebaplar',
        icon: '🍢',
        color: '#DC143C',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Pide & Lahmacun',
        description: 'Fırından çıkmış sıcacık pideler',
        icon: '🫓',
        color: '#D2691E',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Makarna',
        description: 'İtalyan makarna çeşitleri',
        icon: '🍝',
        color: '#228B22',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Salata',
        description: 'Taze ve sağlıklı salatalar',
        icon: '🥗',
        color: '#32CD32',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Tatlılar',
        description: 'Enfes tatlı çeşitleri',
        icon: '🍰',
        color: '#FF69B4',
        isActive: true,
        sortOrder: 8
      }
    ];

    console.log('📝 Kategoriler ekleniyor...');
    const categoryResults = [];
    for (const category of categories) {
      try {
        const result = await addDoc(collection(db, 'categories'), {
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        categoryResults.push({ id: result.id, name: category.name });
        console.log(`✅ Kategori eklendi: ${category.name}`);
      } catch (error) {
        console.error(`❌ Kategori eklenirken hata (${category.name}):`, error);
      }
    }

    // Örnek restoranlar
    const sampleRestaurants = [
      {
        name: 'Mario\'s Pizza',
        description: 'Geleneksel İtalyan pizzacısı',
        category: 'Pizza',
        phone: '+90 532 123 4567',
        address: 'Merkez Mah. Pizza Sok. No:1',
        city: 'İstanbul',
        district: 'Kadıköy',
        deliveryTime: 25,
        minimumOrder: 30,
        deliveryFee: 8,
        rating: 4.7,
        isActive: true,
        isVerified: true,
        imageUrl: '/images/restaurants/marios-pizza.jpg'
      },
      {
        name: 'Burger House',
        description: 'Ev yapımı burger uzmanı',
        category: 'Burger',
        phone: '+90 532 234 5678',
        address: 'Burger Cad. No:15',
        city: 'İstanbul',
        district: 'Beşiktaş',
        deliveryTime: 20,
        minimumOrder: 25,
        deliveryFee: 6,
        rating: 4.5,
        isActive: true,
        isVerified: true,
        imageUrl: '/images/restaurants/burger-house.jpg'
      },
      {
        name: 'Dönerci Mehmet Usta',
        description: 'Et döner uzmanı',
        category: 'Döner',
        phone: '+90 532 345 6789',
        address: 'Et Döner Sok. No:8',
        city: 'Ankara',
        district: 'Çankaya',
        deliveryTime: 30,
        minimumOrder: 20,
        deliveryFee: 5,
        rating: 4.8,
        isActive: true,
        isVerified: true,
        imageUrl: '/images/restaurants/donerci-mehmet.jpg'
      }
    ];

    console.log('🏪 Örnek restoranlar ekleniyor...');
    const restaurantResults = [];
    for (const restaurant of sampleRestaurants) {
      try {
        const result = await addDoc(collection(db, 'restaurants'), {
          ...restaurant,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        restaurantResults.push({ id: result.id, name: restaurant.name });
        console.log(`✅ Restoran eklendi: ${restaurant.name}`);
      } catch (error) {
        console.error(`❌ Restoran eklenirken hata (${restaurant.name}):`, error);
      }
    }

    console.log('✅ Seed işlemi tamamlandı!');
    return {
      categories: categoryResults,
      restaurants: restaurantResults,
      summary: {
        categoriesAdded: categoryResults.length,
        restaurantsAdded: restaurantResults.length
      }
    };

  } catch (error) {
    console.error('❌ Seed işlemi sırasında hata:', error);
    throw error;
  }
} 
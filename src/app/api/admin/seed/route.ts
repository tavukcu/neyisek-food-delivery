import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/scripts/seedData';
import { CategoryService } from '@/services/categoryService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST: Seed veritabanı
export async function POST(request: NextRequest) {
  try {
    // Development ortamında çalışır
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Bu işlem sadece development ortamında çalışır' },
        { status: 403 }
      );
    }

    console.log('🌱 Seed işlemi başlıyor...');
    const result = await seedDatabase();
    
    console.log('✅ Seed işlemi tamamlandı');
    return NextResponse.json({
      success: true,
      message: 'Veritabanı başarıyla seed edildi',
      data: result
    });

  } catch (error) {
    console.error('❌ Seed işlemi hatası:', error);
    return NextResponse.json(
      { error: 'Seed işlemi sırasında hata oluştu', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET: Kategorileri listele (debug amaçlı)
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Bu endpoint sadece development ortamında çalışır' },
        { status: 403 }
      );
    }

    console.log('Development mode - seed script hazır');
    const categories = await CategoryService.getAllCategories();
    
    return NextResponse.json({
      success: true,
      categories,
      count: categories.length
    });

  } catch (error) {
    console.error('❌ Kategoriler getirilemedi:', error);
    return NextResponse.json(
      { error: 'Kategoriler getirilemedi', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Var olan kategorileri güncelle
export async function PATCH(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Bu işlem sadece development ortamında çalışır' },
        { status: 403 }
      );
    }

    console.log('🎨 Kategorilere renk alanları ekleniyor...');
    
    // Renk güncellemeleri
    const colorUpdates = [
      { name: 'Pizza', color: '#FF6B35' },
      { name: 'Burger', color: '#8B4513' },
      { name: 'Döner', color: '#DAA520' },
      { name: 'Kebap', color: '#DC143C' },
      { name: 'Pide & Lahmacun', color: '#D2691E' },
      { name: 'Makarna', color: '#228B22' },
      { name: 'Salata', color: '#32CD32' },
      { name: 'Tatlılar', color: '#FF69B4' },
      { name: 'Köfte', color: '#8B0000' } // Kullanıcının eklediği kategori için
    ];

    const categories = await CategoryService.getAllCategories();
    let updatedCount = 0;

    for (const category of categories) {
      const colorUpdate = colorUpdates.find(update => update.name === category.name);
      if (colorUpdate) {
        try {
          await updateDoc(doc(db, 'categories', category.id), {
            color: colorUpdate.color,
            updatedAt: new Date()
          });
          console.log(`✓ ${category.name} kategorisine renk eklendi: ${colorUpdate.color}`);
          updatedCount++;
        } catch (error) {
          console.error(`✗ ${category.name} güncellenirken hata:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} kategori başarıyla güncellendi`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ Kategori güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kategoriler güncellenirken hata oluştu', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
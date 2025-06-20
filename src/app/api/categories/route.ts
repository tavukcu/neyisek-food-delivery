import { NextResponse } from 'next/server';
import { CategoryService } from '@/services/categoryService';

export async function GET() {
  try {
    console.log('🔍 Categories API: Kategoriler getiriliyor...');
    const categories = await CategoryService.getAllCategories();
    
    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories.filter(cat => cat.isActive)
    });
  } catch (error) {
    console.error('❌ Categories API hatası:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 
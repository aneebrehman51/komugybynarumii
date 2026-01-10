import { useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface MenuSectionProps {
  onAddToCart: (product: Product) => void;
}

export default function MenuSection({ onAddToCart }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const allProducts: Product[] = [
    {
      id: 'cheese-1',
      name: 'Japanese Cheesecake - 6 inch',
      price: 1600,
      description: 'Light and fluffy Japanese-style cheesecake',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.21.35_pm.jpeg',
    },
    {
      id: 'cheese-2',
      name: 'New York Cheesecake - 6 inch',
      price: 1700,
      description: 'Classic creamy New York style cheesecake',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.25.02_pm.jpeg',
    },
    {
      id: 'cheese-3',
      name: 'New York Cheesecake - 8 inch',
      price: 3400,
      description: 'Classic creamy New York style cheesecake',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.25.02_pm.jpeg',
    },
    {
      id: 'cheese-4',
      name: 'Baked Cheesecake Sticks - 12 pcs',
      price: 1700,
      description: 'Bite-sized cheesecake portions',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.26.33_pm.jpeg',
    },
    {
      id: 'cheese-5',
      name: 'Matcha Cheesecake',
      price: 2200,
      description: 'Japanese green tea cheesecake blend',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.32.24_pm.jpeg',
    },
    {
      id: 'cheese-6',
      name: 'Strawberry Cheesecake',
      price: 2000,
      description: 'Fresh strawberry and creamy cheesecake',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.32.48_pm.jpeg',
    },
    {
      id: 'chiffon-1',
      name: 'Vanilla Chiffon Cake',
      price: 1100,
      description: 'Light and airy vanilla chiffon cake',
      category: 'Chiffon Cake',
          image: '/whatsapp_image_2025-12-27_at_11.30.02_pm.jpeg',
    },
    {
      id: 'chiffon-2',
      name: 'Chocolate Chiffon Cake',
      price: 1300,
      description: 'Light and airy chocolate chiffon cake',
      category: 'Chiffon Cake',
      image: 'whatsapp_image_2025-12-27_at_11.321.481_pm.jpeg',
    },
    {
      id: 'chiffon-3',
      name: 'Matcha Chiffon Cake',
      price: 1500,
      description: 'Japanese green tea chiffon cake',
      category: 'Chiffon Cake',
      image: 'whatsapp_image_2025-12-27_at_11.322.482_pm.jpeg',},
    {
      id: 'chiffon-4',
      name: 'Marble Chiffon Cake',
      price: 1300,
      description: 'Vanilla and chocolate swirled chiffon cake',
      category: 'Chiffon Cake',
       image: 'whatsapp_image_2025-12-27_at_11.323.483_pm.jpeg',    },
    {
      id: 'brownie-1',
      name: 'Chocolate Brownies - 16 pcs',
      price: 2100,
      description: 'Rich and fudgy chocolate brownies',
      category: 'Brownies',
        image: 'whatsapp_image_2025-12-27_at_11.324.484_pm.jpeg',    
    },
    {
      id: 'whipped-1',
      name: 'Vanilla Whipped Cream Cake',
      price: 1400,
      description: 'Soft vanilla cake with whipped cream frosting',
      category: 'Whipped Cream Cake',
  image: 'whatsapp_image_2025-12-27_at_11.325.485_pm.jpeg',        },
    {
      id: 'whipped-2',
      name: 'Chocolate Whipped Cream Cake',
      price: 1600,
      description: 'Soft chocolate cake with whipped cream frosting',
      category: 'Whipped Cream Cake',
  image: 'whatsapp_image_2025-12-27_at_11.326.486_pm.jpeg',        },
    {
      id: 'whipped-3',
      name: 'Matcha Whipped Cream Cake',
      price: 1800,
      description: 'Soft matcha cake with whipped cream frosting',
      category: 'Whipped Cream Cake',
  image: 'whatsapp_image_2025-12-27_at_11.327.487_pm.jpeg',        },
  ];

  const categories = ['All', 'Cheesecake', 'Chiffon Cake', 'Brownies', 'Whipped Cream Cake'];

  const filteredProducts =
    selectedCategory === 'All'
      ? allProducts
      : allProducts.filter((product) => product.category === selectedCategory);

  return (
    <section id="menu" className="py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">Our Menu</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Explore our complete collection of handcrafted baked goods
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-amber-100 hover:text-amber-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

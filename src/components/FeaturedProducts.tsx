import ProductCard from './ProductCard';
import { Product } from '../types';

interface FeaturedProductsProps {
  onAddToCart: (product: Product) => void;
}

export default function FeaturedProducts({ onAddToCart }: FeaturedProductsProps) {
  const featuredProducts: Product[] = [
    {
      id: 'featured-1',
      name: 'Japanese Cheesecake - 6 inch',
      price: 1600,
      description: 'Light and fluffy Japanese-style cheesecake with a delicate texture',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.21.35_pm.jpeg',
    },
    {
      id: 'featured-2',
      name: 'Chocolate Chiffon Cake',
      price: 1300,
      description: 'Light and airy chocolate chiffon cake with rich cocoa flavor',
      category: 'Chiffon Cake',
      image: 'whatsapp_image_2025-12-27_at_11.321.481_pm.jpeg',
    },
    {
      id: 'featured-3',
      name: 'Baked Cheesecake Sticks - 12 pcs',
      price: 1700,
      description: 'Bite-sized cheesecake portions, perfect for sharing',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.26.33_pm.jpeg',
    },
    {
      id: 'featured-4',
      name: 'New York Cheesecake - 6 inch',
      price: 1700,
      description: 'Classic creamy New York style cheesecake with perfect texture',
      category: 'Cheesecake',
      image: '/whatsapp_image_2025-12-27_at_11.25.02_pm.jpeg',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular handcrafted baked goods, made fresh daily with premium ingredients
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

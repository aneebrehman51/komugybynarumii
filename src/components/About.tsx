export default function About() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-amber-900 mb-6">About Komugi by Narumi</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Welcome to Komugi by Narumi, where passion meets perfection in every bite. Our bakery
                specializes in authentic Japanese-style baked goods, from light and fluffy chiffon cakes
                to rich and creamy cheesecakes.
              </p>
              <p>
                Founded with a love for traditional Japanese baking techniques, we use only the finest
                ingredients to create desserts that are not only delicious but also beautifully crafted.
                Each item is made fresh daily with meticulous attention to detail.
              </p>
              <p>
                Whether you're celebrating a special occasion or simply treating yourself, our collection
                of handcrafted desserts is sure to delight your taste buds. We offer convenient delivery
                service right to your doorstep, ensuring that you can enjoy our fresh baked goods in the
                comfort of your home.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Bakery"
              className="rounded-lg shadow-xl w-full h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

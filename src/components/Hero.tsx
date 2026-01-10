export default function Hero() {
  const scrollToMenu = () => {
    const element = document.getElementById('menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative pt-16 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-amber-600">
            <img
              src="/whatsapp_image_2025-12-28_at_11.15.04_pm.jpeg"
              alt="Komugi by Narumi Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-amber-900 mb-6 animate-fade-in">
          Komugi by Narumi
        </h1>
        <p className="text-xl md:text-2xl text-amber-800 mb-8 max-w-2xl mx-auto">
          Freshly baked goods delivered to your door
        </p>
        <button
          onClick={scrollToMenu}
          className="bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Order Now
        </button>
      </div>
    </section>
  );
}

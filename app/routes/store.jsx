// app/routes/store.jsx
import React, { useState } from 'react';

export default function Storefront() {
  const [isCartOpen, setCartOpen] = useState(false);

  return (
    <div className="font-sans p-8">
      <header className="flex justify-between items-center pb-4 mb-8 border-b">
        <h1 className="text-3xl font-bold">My Awesome Store</h1>
        <button 
          onClick={() => setCartOpen(true)}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          View Cart
        </button>
      </header>

      <main>
        <h2 className="text-2xl font-semibold mb-4">Our Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mock Product */}
          <div className="border rounded-lg p-4">
            <img src="https://via.placeholder.com/300?text=Cool+T-Shirt" alt="T-Shirt" className="w-full h-64 object-cover rounded-md mb-4" />
            <h3 className="text-lg font-semibold">Cool T-Shirt</h3>
            <p className="text-gray-600">$20.00</p>
            <button 
              onClick={() => setCartOpen(true)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Add to Cart
            </button>
          </div>
          {/* Mock Product */}
          <div className="border rounded-lg p-4">
            <img src="https://via.placeholder.com/300?text=Nice+Hat" alt="Hat" className="w-full h-64 object-cover rounded-md mb-4" />
            <h3 className="text-lg font-semibold">Nice Hat</h3>
            <p className="text-gray-600">$15.00</p>
            <button 
              onClick={() => setCartOpen(true)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </main>

      {/* Note: Cart drawer functionality has been moved to app.cartdrawer.jsx */}
    </div>
  );
}

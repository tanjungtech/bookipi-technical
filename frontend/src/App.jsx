
export default function App() {

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl min-h-screen mx-auto">
        <div className="flex min-h-screen items-center justify-center">
          <div className="bg-white w-1/4 mx-auto rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-60">
              <img
                src="https://images.unsplash.com/photo-1511556820780-d912e42b4980"
                alt="Flash Sale Item"
                className="object-cover w-full h-full absolute inset-0"
              />
            </div>
            <div className="p-5">
              <div className="h-22 overflow-hidden">
                <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">Flash Sale Item</h2>
                <p className="text-gray-500 text-sm mb-2">50% off</p>
              </div>
              <p className="text-gray-500 line-clamp-4 h-20">Flash Sale Description</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

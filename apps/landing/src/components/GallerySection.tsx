export function GallerySection() {
  return (
    <section className="bg-[#f8fafa] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative grid gap-4 sm:grid-cols-2">
          {/* Doctor consultation */}
          <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/5">
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=700&h=500&fit=crop"
              alt="Medical consultation"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ aspectRatio: "7/5" }}
            />
          </div>

          {/* Luxury interior */}
          <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/5">
            <img
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&h=500&fit=crop"
              alt="Luxury suite"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ aspectRatio: "7/5" }}
            />
          </div>

          {/* Small phone mockup center overlay */}
          <div className="absolute bottom-[-30px] left-1/2 z-10 hidden -translate-x-1/2 sm:block">
            <div className="w-[130px] overflow-hidden rounded-[22px] border-[5px] border-[#1a1a2e] bg-white shadow-2xl shadow-black/20">
              <div className="flex h-3.5 items-center justify-center bg-white">
                <div className="h-[2.5px] w-[28px] rounded-full bg-[#1a1a2e]" />
              </div>
              <div className="space-y-1 px-2 pb-3">
                <div className="rounded-md bg-[#7a9e9e]/10 px-2 py-1.5">
                  <p className="text-[6px] font-semibold text-[#1a1a2e]">Health & Longevity</p>
                </div>
                <div className="rounded-md bg-[#e8d5c4]/20 px-2 py-1.5">
                  <p className="text-[6px] font-semibold text-[#1a1a2e]">Wealth Management</p>
                </div>
                <div className="rounded-md bg-[#d4dde8]/20 px-2 py-1.5">
                  <p className="text-[6px] font-semibold text-[#1a1a2e]">Lifestyle Services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

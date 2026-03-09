import { useState } from "react";

const cases = [
  {
    id: 1,
    type: "Dual-Chamber ATX",
    name: "NZXT H9 Elite Flow",
    price: 239.99,
    inStock: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5eparY0GQMBc_BQsgCjEC29AMKFMRh91K8dRA9L3puzo2Cuf_9YRxfQ1Wb4Tqzlw9b1_ZXyIhJ0VTDoH9txwAfEV9EZ80cycKL_1ptg-eJYVx2mNi7UEajLMGVTehDf1Jw9rN8GuDeKqJWVKBxKqREx9OZkCUUdCuCgsSRU-WVa1k3dVxsqUjsSsUEsO8ozFub0RIoQOVYeMTTOzLGgRieEulzhOZWy1EOFEdTriaz6p_CHtiUqXeHs-xpXgz0LD9ENopP7hZrw",
  },
  {
    id: 2,
    type: "Mid-Tower ATX",
    name: "Fractal North Charcoal",
    price: 199.0,
    inStock: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5eparY0GQMBc_BQsgCjEC29AMKFMRh91K8dRA9L3puzo2Cuf_9YRxfQ1Wb4Tqzlw9b1_ZXyIhJ0VTDoH9txwAfEV9EZ80cycKL_1ptg-eJYVx2mNi7UEajLMGVTehDf1Jw9rN8GuDeKqJWVKBxKqREx9OZkCUUdCuCgsSRU-WVa1k3dVxsqUjsSsUEsO8ozFub0RIoQOVYeMTTOzLGgRieEulzhOZWy1EOFEdTriaz6p_CHtiUqXeHs-xpXgz0LD9ENopP7hZrw",
  },
  {
    id: 3,
    type: "Performance SFF",
    name: "Lian Li O11 Dynamic",
    price: 165.0,
    inStock: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5eparY0GQMBc_BQsgCjEC29AMKFMRh91K8dRA9L3puzo2Cuf_9YRxfQ1Wb4Tqzlw9b1_ZXyIhJ0VTDoH9txwAfEV9EZ80cycKL_1ptg-eJYVx2mNi7UEajLMGVTehDf1Jw9rN8GuDeKqJWVKBxKqREx9OZkCUUdCuCgsSRU-WVa1k3dVxsqUjsSsUEsO8ozFub0RIoQOVYeMTTOzLGgRieEulzhOZWy1EOFEdTriaz6p_CHtiUqXeHs-xpXgz0LD9ENopP7hZrw",
  },
  {
    id: 4,
    type: "Stealth Mini",
    name: "Cooler Master NR200P",
    price: 129.99,
    inStock: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5eparY0GQMBc_BQsgCjEC29AMKFMRh91K8dRA9L3puzo2Cuf_9YRxfQ1Wb4Tqzlw9b1_ZXyIhJ0VTDoH9txwAfEV9EZ80cycKL_1ptg-eJYVx2mNi7UEajLMGVTehDf1Jw9rN8GuDeKqJWVKBxKqREx9OZkCUUdCuCgsSRU-WVa1k3dVxsqUjsSsUEsO8ozFub0RIoQOVYeMTTOzLGgRieEulzhOZWy1EOFEdTriaz6p_CHtiUqXeHs-xpXgz0LD9ENopP7hZrw",
  },
];

const navItems = [
  { icon: "grid_view", label: "Case" },
  { icon: "memory", label: "CPU" },
  { icon: "processing_cluster", label: "GPU" },
  { icon: "memory_alt", label: "RAM" },
  { icon: "sd_card", label: "SSD" },
  { icon: "settings_input_component", label: "PSU" },
];

const buildSummary = [
  { label: "Processor", price: "$589", value: "Intel Core i9-14900K", missing: false },
  { label: "Graphics", price: "$1,699", value: "NVIDIA RTX 4090 24GB", missing: false },
  { label: "Memory", price: null, value: "Add DDR5 RAM to continue", missing: true },
  { label: "Storage", price: "$189", value: "Samsung 990 Pro 2TB", missing: false },
  { label: "Case", price: "$239", value: "NZXT H9 Elite Flow", missing: false },
];

const MOTHERBOARD_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCa4znJq5OWQokdJUM4GEYw6P3crouhy8TeBnb8qvnzFLgBMsQxFHJwKOj095PgDRfo4z-xKVqdW8T4XCHvjNl0IHQ6UYgdomhkPGtoo6D_OLKQeqHCXXJl_Kg5VmlrHHXUm9sbAUPcY4Xdg1Nx_lw2g5XtOWIFzAj046z-Ud95N3Qjz_pdN9YvQoU94m5EecmjgFgN2rTZlxLvaklD4jkOcJzdGksTCPOQNty7XqM21Z6FmG6brONQ45hzk4DxIGhHvvv3Dve-Gw";

const CPU_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC67FM9OG5Z2GO-3iKlSd-wXh1WT6mC_ubq4D87aJx9laWHYq4JRmEoBOMloVWWfMmbsiZz_lWTv2dvX99E7IxsaV3GUgdomhkPGtoo6D_OLKQeqHCXXJl_Kg5VmlrHHXUm9sbAUPcY4Xdg1Nx_lw2g5XtOWIFzAj046z-Ud95N3Qjz_pdN9YvQoU94m5EecmjgFgN2rTZlxLvaklD4jkOcJzdGksTCPOQNty7XqM21Z6FmG6brONQ45hzk4DxIGhHvvv3Dve-Gw";

export default function PCConfigurator() {
  const [selectedCase, setSelectedCase] = useState(cases[0]);
  const [activeNav, setActiveNav] = useState(0);

  const totalPrice = 2935.42;

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 lg:px-12 py-3 z-50 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-blue-600">
            <span className="material-symbols-outlined text-3xl font-bold">view_in_ar</span>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
              PC Master Build
            </h2>
          </div>
          <nav className="hidden md:flex items-center gap-9">
            <a className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-blue-600 transition-colors" href="#">
              Configurator
            </a>
            <a className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-blue-600 transition-colors" href="#">
              Inspiration
            </a>
            <a className="text-slate-400 dark:text-slate-500 text-sm font-medium cursor-not-allowed" href="#">
              Support
            </a>
          </nav>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right mr-4 hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Estimated Total</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Checkout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Nav */}
        <aside className="w-20 lg:w-24 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center py-8 gap-8 overflow-y-auto z-40">
          {navItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(i)}
              className={`group flex flex-col items-center gap-2 transition-colors ${
                activeNav === i ? "text-blue-600" : "text-slate-400 hover:text-blue-600"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                  activeNav === i
                    ? "bg-blue-600/10"
                    : "bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600/5"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Component Selector Panel */}
          <div className="p-6 pb-2 shrink-0 z-30">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Choose your Foundation</h3>
                <p className="text-sm text-slate-500">Selected: {selectedCase.name}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Case Cards */}
            <div className="flex gap-4 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
              {cases.map((c) => {
                const isSelected = selectedCase.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`min-w-[280px] bg-white dark:bg-slate-900 rounded-2xl p-4 cursor-pointer transition-all relative ${
                      isSelected
                        ? "border-2 border-blue-600 shadow-xl"
                        : "border border-slate-100 dark:border-slate-800 hover:shadow-lg"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">check</span>
                      </div>
                    )}
                    <div className="h-32 w-full flex items-center justify-center mb-4">
                      <img
                        alt="Case"
                        className={`h-full object-contain transition-all ${
                          isSelected ? "" : "grayscale opacity-60"
                        }`}
                        src={c.img}
                      />
                    </div>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                        isSelected ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {c.type}
                    </p>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h4>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-black">${c.price.toFixed(2)}</span>
                      {isSelected ? (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          IN STOCK
                        </span>
                      ) : (
                        <button className="text-[10px] font-bold text-blue-600 hover:underline">SELECT</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Preview Area */}
          <div className="flex-1 relative flex items-center justify-center p-12 overflow-hidden bg-gradient-radial from-slate-100 to-transparent dark:from-slate-800/20 dark:to-transparent">
            <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
              <img
                alt="PC Case"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl z-10"
                src={selectedCase.img}
              />

              {/* Wireframe Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none p-12 translate-x-4">
                <div className="relative w-full h-full opacity-40">
                  <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-4/5 h-1/4 border-2 border-blue-600/40 rounded-lg flex items-center justify-center bg-blue-600/5">
                    <img
                      className="w-full h-full object-contain"
                      style={{ filter: "grayscale(1) brightness(1.5) opacity(0.2)", mixBlendMode: "luminosity" }}
                      src={MOTHERBOARD_IMG}
                      alt="Motherboard"
                    />
                  </div>
                  <div className="absolute top-[25%] left-1/3 w-20 h-20 border-2 border-blue-600/40 rounded flex items-center justify-center bg-blue-600/5">
                    <img
                      className="w-2/3 h-2/3 object-contain"
                      style={{ filter: "grayscale(1) brightness(1.5) opacity(0.2)", mixBlendMode: "luminosity" }}
                      src={CPU_IMG}
                      alt="CPU"
                    />
                  </div>
                  <div className="absolute top-[22%] left-1/2 w-12 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 text-xs">add</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 blur-3xl rounded-full" />
            </div>

            {/* Thermal Status Badge */}
            <div className="absolute top-1/4 right-1/4 z-30">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Thermal Status</p>
                  <p className="text-xs font-bold">Optimized Airflow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="h-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center px-8 shrink-0 justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Compatible Build</p>
                  <p className="text-[10px] text-slate-500">No clearance issues detected with RTX 4090</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-yellow-500">bolt</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">740W Est.</p>
                  <p className="text-[10px] text-slate-500">850W+ PSU Recommended</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {["share", "save", "visibility"].map((icon) => (
                <button
                  key={icon}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Build Summary */}
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto hidden xl:flex flex-col p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Build Summary</h3>
          <div className="space-y-6 flex-1">
            {buildSummary.map((item) => (
              <div key={item.label} className="group cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <p
                    className={`text-xs font-bold uppercase ${
                      item.missing ? "text-slate-400" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.missing ? (
                    <p className="text-xs font-bold text-blue-600 italic">MISSING</p>
                  ) : (
                    <p className="text-xs font-bold">{item.price}</p>
                  )}
                </div>
                <p
                  className={`text-[11px] ${
                    item.missing
                      ? "text-red-400 font-medium"
                      : "text-slate-500 group-hover:text-blue-600 transition-colors"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-600/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">rocket_launch</span>
                <p className="text-[10px] font-black uppercase text-blue-600">Performance Tier</p>
              </div>
              <p className="text-sm font-bold">Ultra 4K Gaming Ready</p>
              <p className="text-[11px] text-slate-500 mt-1">Estimated 140+ FPS in AAA titles</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
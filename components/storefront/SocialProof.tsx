import { Star } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "Arjun S.",
    location: "Pune",
    rating: 5,
    text: "Build PC feature is phenomenal. It flagged an incompatibility I would have missed. My i9 + RTX 4080 build runs flawlessly.",
    product: "Custom Gaming Build",
    timeAgo: "2 days ago",
  },
  {
    id: 2,
    name: "Priya M.",
    location: "Bangalore",
    rating: 5,
    text: "Prices are genuinely competitive. Got my RAM delivered next day. Packaging was secure and the product is 100% genuine.",
    product: "DDR5 32GB Kit",
    timeAgo: "1 week ago",
  },
  {
    id: 3,
    name: "Rohan K.",
    location: "Delhi",
    rating: 4,
    text: "Great selection of GPUs. Support team helped me choose between two options over chat. Very knowledgeable staff.",
    product: "RTX 4070 Super",
    timeAgo: "3 days ago",
  },
] as const;

const ACTIVITY = [
  { city: "Mumbai", product: "Ryzen 7 7800X3D", timeAgo: "3 min ago" },
  { city: "Hyderabad", product: "RTX 4070 Ti Super", timeAgo: "8 min ago" },
  { city: "Chennai", product: "Samsung 990 Pro 2TB", timeAgo: "12 min ago" },
  { city: "Kolkata", product: "ASUS ROG Maximus Z790", timeAgo: "18 min ago" },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="border-t border-stone-100 py-12 sm:py-16" aria-label="Customer reviews and activity">
      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Left: heading + summary stat */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Reviews
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight leading-tight">
            Trusted by builders across India
          </h2>

          {/* Aggregate rating */}
          <div className="mt-6 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-violet-50/20 to-transparent p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-900">4.8</span>
              <span className="text-sm text-indigo-500 font-semibold">/ 5</span>
            </div>
            <StarRating rating={5} />
            <p className="mt-1.5 text-xs text-indigo-700/85 font-medium">Based on 2,400+ verified orders</p>
          </div>

          {/* Live activity */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-stone-500 mb-3">Recent purchases</p>
            <div className="space-y-3">
              {ACTIVITY.map((item) => (
                <div key={item.product} className="flex items-start gap-2.5">
                  <span className="relative flex h-2 w-2 mt-1.5 shrink-0" aria-hidden>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div>
                    <p className="text-xs font-medium text-stone-700 line-clamp-1">{item.product}</p>
                    <p className="text-[11px] text-stone-400">
                      {item.city} · {item.timeAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: review cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {REVIEWS.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-stone-200 bg-white p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/10 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-full bg-gradient-to-tr border flex items-center justify-center text-xs font-bold ${
                    review.id % 3 === 0
                      ? "from-indigo-50 to-violet-50 text-indigo-600 border-indigo-100"
                      : review.id % 3 === 1
                      ? "from-emerald-50 to-teal-50 text-emerald-600 border-emerald-100"
                      : "from-amber-50 to-orange-50 text-amber-600 border-amber-100"
                  }`}>
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors">{review.name}</p>
                    <p className="text-xs text-stone-400">{review.location} · {review.timeAgo}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              <blockquote className="mt-3 text-sm text-stone-600 leading-relaxed">
                "{review.text}"
              </blockquote>

              <p className="mt-3 text-[11px] font-medium text-indigo-600/80 bg-indigo-50/50 px-2 py-0.5 rounded w-fit">
                Verified purchase: {review.product}
              </p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
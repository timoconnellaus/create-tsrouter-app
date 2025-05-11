import { Link } from "@tanstack/react-router";

import { allPosts } from "content-collections";

export default function Header() {
  const categories = Array.from(
    new Set(allPosts.flatMap((post) => post.categories))
  );
  return (
    <header className="text-slate-700 font-serif font-extrabold fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/50 border-b border-slate-200/50 transition-all">
      <nav className="max-w-7xl mx-auto p-4 flex gap-2 justify-between">
        <div className="flex flex-row items-center space-x-6">
          <div className="text-xl tracking-wide">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              Hawaii Adventures
            </Link>
          </div>
          <div className="flex gap-6">
            {categories.map((category) => (
              <div key={category}>
                <Link
                  to={`/category/${category}`}
                  className="hover:text-emerald-700 transition-colors"
                >
                  {category}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

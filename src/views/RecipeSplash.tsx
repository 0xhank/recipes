import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFilteredRecipes, useRecipeStore } from "../stores/recipeStore";

/**
 * A fun, kid-friendly splash page that displays recipes from the keepsync store
 */
const RecipeSplash: React.FC = () => {
  const {
    recipes,
    setSearchTerm,
    searchTerm,
    setFilterCategory,
    filterCategory,
  } = useRecipeStore();
  const filteredRecipes = getFilteredRecipes(useRecipeStore());
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Random fun food emojis to use with recipes that don't have images
  const foodEmojis = [
    "🍕",
    "🍔",
    "🍦",
    "🥞",
    "🍩",
    "🍪",
    "🍎",
    "🥗",
    "🍣",
    "🌮",
    "🍇",
    "🥐",
  ];

  const getRandomEmoji = () => {
    return foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
  };

  return (
    <main className="min-h-screen bg-wash p-4 md:p-6 lg:p-8">
      {/* Header with title */}
      <header className="max-w-5xl mx-auto text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-4 font-serif">
          Family Best Bites
        </h1>
        <p className="text-xl text-neutral">
          Your treasured family recipes, all in one place! 🍲
        </p>
      </header>

      {/* Search bar */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-white rounded-full shadow-md px-4 py-2 flex items-center">
          <span className="text-2xl mr-2 text-neutral">🔍</span>
          <input
            type="text"
            placeholder="Find a yummy recipe..."
            className="w-full bg-transparent border-none focus:outline-none text-lg text-neutral placeholder-neutral"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-neutral hover:text-primary-dark"
            >
              ✖️
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <section className="max-w-6xl mx-auto">
        {isLoading ? (
          // Fun loading animation
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin text-xl mb-4">
              <img src="icons/apple.png" alt="Loading" className="w-10 h-10" />
            </div>
            <p className="text-xl text-primary font-bold">
              Setting the table...
            </p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          // Empty state with friendly message
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-7xl mb-4">🥣</div>
            <h2 className="text-2xl font-bold text-primary-dark mb-2">
              No recipes yet!
            </h2>
            <p className="text-lg text-neutral">
              Time to add some yummy recipes to your collection!
            </p>
          </div>
        ) : (
          // Recipe grid with colorful cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="block rounded-2xl shadow-lg overflow-hidden transform transition hover:-translate-y-1 hover:shadow-xl no-underline"
              >
                <div
                  className={`bg-white h-full flex flex-col ${
                    recipe.isFavorite ? "ring-4 ring-yellow-400" : ""
                  }`}
                >
                  {recipe.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-wash">
                      <span className="text-7xl">{getRandomEmoji()}</span>
                    </div>
                  )}

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-primary-dark mr-2">
                          {recipe.title}
                        </h3>
                        {recipe.isFavorite && (
                          <span className="text-xl">⭐</span>
                        )}
                      </div>

                      <p className="text-neutral mb-3 line-clamp-2">
                        {recipe.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {recipe.category.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 bg-wash text-primary rounded-full text-xs font-medium cursor-pointer hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFilterCategory(cat);
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-neutral mb-3">
                        <div>
                          <span className="font-medium">🕑 Prep:</span>{" "}
                          {recipe.prepTime} min
                        </div>
                        <div>
                          <span className="font-medium">👨‍🍳 Cook:</span>{" "}
                          {recipe.cookTime} min
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <span
                          className={`
                          inline-block px-2 py-1 rounded-full font-medium bg-neutral text-white
                        `}
                        >
                          {recipe.difficulty.charAt(0).toUpperCase() +
                            recipe.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Floating action button to ADD recipes */}
      {!isLoading && (
        <Link
          to="/create"
          className="fixed bottom-8 left-8 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
          title="Add New Recipe"
        >
          <span className="text-3xl">+</span>
        </Link>
      )}

      {/* Floating action button to clear filters */}
      {(searchTerm || filterCategory) && (
        <button
          onClick={() => {
            setSearchTerm("");
            setFilterCategory(null);
          }}
          className="fixed bottom-8 right-8 bg-neutral text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-gray-500 transition-colors"
        >
          <span className="text-xl">🧹</span>
        </button>
      )}
    </main>
  );
};

export default RecipeSplash;

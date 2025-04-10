import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecipeStore } from "../stores/recipeStore"; // Assuming this path is correct

/**
 * Displays the detailed information for a single recipe.
 */
const RecipeDetail: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const recipe = useRecipeStore((state) =>
    state.recipes.find((r) => r.id === recipeId)
  );

  // Add a loading state?
  // const isLoading = useRecipeStore(state => state.isLoading); // If store supports it

  if (!recipe) {
    // Consider fetching the recipe if not found, if your store supports async loading
    // useEffect(() => {
    //   if (!recipe && recipeId) {
    //      fetchRecipe(recipeId); // Example function from your store
    //   }
    // }, [recipe, recipeId, fetchRecipe]);

    // if (isLoading) {
    //   return <main className="min-h-screen p-8 flex items-center justify-center">Loading...</main>;
    // }

    return (
      <main className="min-h-screen bg-wash p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-primary mb-4 font-serif">
          Recipe Not Found
        </h1>
        <p className="text-neutral mb-6">
          Oh dear, it seems the recipe you seek has vanished into thin air!
          Perhaps it was never here?
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark transition-colors"
        >
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-wash p-4 md:p-8">
      {/* Back Button - Positioned absolutely within the main container */}
      <button
        onClick={() => navigate(-1)} // Go back to the previous page
        className="absolute top-6 left-6 z-10 text-primary hover:text-primary-dark bg-white bg-opacity-70 backdrop-blur-sm p-2 rounded-full shadow-md transition-colors flex items-center gap-1 text-sm"
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {/* Optionally add text: Back */}
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary p-6 pt-10 pb-8 text-white relative">
          {/* Removed absolute back button from here */}
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center font-serif">
            {recipe.title}
          </h1>
          <p className="text-lg text-red-100 text-center italic mb-4">
            {recipe.description}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-red-100 mt-4">
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {" "}
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />{" "}
              </svg>
              Serves: {recipe.servings}
            </span>
            {recipe.prepTime && (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {" "}
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z"
                    clipRule="evenodd"
                  />{" "}
                </svg>
                Prep: {recipe.prepTime} min
              </span>
            )}
            {recipe.cookTime && (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {" "}
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z"
                    clipRule="evenodd"
                  />{" "}
                </svg>
                Cook: {recipe.cookTime} min
              </span>
            )}
            <span className="flex items-center gap-1 capitalize">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {" "}
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />{" "}
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />{" "}
              </svg>
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4 border-b-2 border-primary pb-2 font-serif">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                  <span className="text-neutral">
                    {ing.amount !== 0 && (
                      <span className="font-medium">{ing.amount}</span>
                    )}
                    {ing.unit && (
                      <span className="font-medium"> {ing.unit}</span>
                    )}
                    <span className="ml-1">{ing.name}</span>
                    {ing.preparation && (
                      <span className="text-gray-500 text-sm italic">
                        , {ing.preparation}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-primary-dark mb-4 border-b-2 border-primary pb-2 font-serif">
              Instructions
            </h2>
            <ol className="space-y-4">
              {recipe.instructions
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((inst, index) => (
                  <li key={inst.id} className="flex">
                    <span className="flex-shrink-0 bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-neutral leading-relaxed">
                      {inst.text}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Footer / Meta Info */}
        <div className="bg-wash p-6 border-t border-gray-200 text-sm text-neutral">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recipe.category && recipe.category.length > 0 && (
              <div>
                <strong className="text-primary-dark block mb-1">
                  Category:
                </strong>
                <div className="flex flex-wrap gap-1">
                  {recipe.category.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-wash text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recipe.cuisine && (
              <div>
                <strong className="text-primary-dark block mb-1">
                  Cuisine:
                </strong>{" "}
                {recipe.cuisine}
              </div>
            )}
            {recipe.author && (
              <div>
                <strong className="text-primary-dark block mb-1">
                  Author:
                </strong>{" "}
                {recipe.author}
              </div>
            )}
            <div>
              <strong className="text-primary-dark block mb-1">Added:</strong>{" "}
              {new Date(recipe.dateCreated).toLocaleDateString()}
            </div>
            {recipe.dateModified &&
              new Date(recipe.dateModified).getTime() !==
                new Date(recipe.dateCreated).getTime() && (
                <div>
                  <strong className="text-primary-dark block mb-1">
                    Modified:
                  </strong>{" "}
                  {new Date(recipe.dateModified).toLocaleDateString()}
                </div>
              )}
            {/* Consider adding an edit button/link here if desired */}
            {/* <div>
                <Link to={`/edit/${recipe.id}`} className="text-purple-600 hover:underline font-medium inline-flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg>
                    Edit Recipe
                </Link>
             </div> */}
          </div>
        </div>
      </div>
    </main>
  );
};

export default RecipeDetail;

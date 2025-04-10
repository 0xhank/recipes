import React from "react";
import { Route, Routes } from "react-router-dom";
import { CreateRecipe, HelloWorld, RecipeDetail, RecipeSplash } from "./views";

const App: React.FC = () => {
  return (
    <div className="bg-wash min-h-screen">
      <Routes>
        <Route path="/" element={<RecipeSplash />} />
        <Route path="/recipe/:recipeId" element={<RecipeDetail />} />
        <Route path="/create" element={<CreateRecipe />} />
        <Route path="/hello" element={<HelloWorld />} />
      </Routes>
    </div>
  );
};

export default App;

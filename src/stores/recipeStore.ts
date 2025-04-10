/**
 * @fileoverview A keepsync-enabled Zustand store for managing recipe data
 *
 * Key features:
 * - Full recipe schema with all essential components
 * - Real-time synchronization via keepsync
 * - Atomic state updates
 * - Type-safe operations with TypeScript
 */

import { sync } from "@tonk/keepsync";
import { create } from "zustand";

/**
 * Interface representing a recipe ingredient with amount, unit and preparation notes
 */
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  preparation?: string; // Optional preparation notes (e.g., "finely chopped")
}

/**
 * Interface representing a recipe instruction step
 */
export interface Instruction {
  id: string;
  stepNumber: number;
  text: string;
}

/**
 * Nutritional information for a recipe
 */
export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  sodium?: number;
  fiber?: number;
}

/**
 * Core recipe data structure with all elements of a complete recipe
 */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTime: number; // In minutes
  cookTime: number; // In minutes
  servings: number;
  category: string[];
  cuisine: string; // e.g., Italian, Mexican, etc.
  difficulty: "easy" | "medium" | "hard";
  nutrition?: Nutrition;
  imageUrl?: string;
  author: string;
  dateCreated: Date;
  dateModified: Date;
  notes?: string;
  isFavorite: boolean;
}

/**
 * Recipe data state interface defining all data properties
 */
interface RecipeData {
  recipes: Recipe[];
  selectedRecipeId: string | null;
}

/**
 * Recipe UI state interface for managing UI-specific properties
 */
interface RecipeUIState {
  isEditing: boolean;
  isCreating: boolean;
  searchTerm: string;
  filterCategory: string | null;
  isLoading: boolean;
}

/**
 * Recipe action interface defining all ways to modify the state
 */
interface RecipeActions {
  // Recipe CRUD operations
  createRecipe: (
    recipe: Omit<Recipe, "id" | "dateCreated" | "dateModified">
  ) => void;
  updateRecipe: (id: string, recipeData: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  // Ingredient management
  addIngredient: (recipeId: string, ingredient: Omit<Ingredient, "id">) => void;
  updateIngredient: (
    recipeId: string,
    ingredientId: string,
    data: Partial<Ingredient>
  ) => void;
  removeIngredient: (recipeId: string, ingredientId: string) => void;

  // Instruction management
  addInstruction: (
    recipeId: string,
    instruction: Omit<Instruction, "id">
  ) => void;
  updateInstruction: (
    recipeId: string,
    instructionId: string,
    data: Partial<Instruction>
  ) => void;
  removeInstruction: (recipeId: string, instructionId: string) => void;

  // UI actions
  selectRecipe: (id: string | null) => void;
  startEditing: () => void;
  finishEditing: () => void;
  startCreating: () => void;
  cancelCreating: () => void;
  setSearchTerm: (term: string) => void;
  setFilterCategory: (category: string | null) => void;

  // Utility actions
  toggleFavorite: (id: string) => void;
}

/**
 * Combined type for the complete recipe store
 */
type RecipeStore = RecipeData & RecipeUIState & RecipeActions;

/**
 * Creates a Zustand store for recipe management with keepsync integration
 *
 * @example
 * const { recipes, createRecipe, selectRecipe } = useRecipeStore();
 *
 * @remarks
 * - Uses keepsync for real-time collaboration
 * - Data updates are atomic and type-safe
 * - Each action is focused on a specific state modification
 */
export const useRecipeStore = create<RecipeStore>(
  sync(
    (set, get) => ({
      // Initial data state
      recipes: [],
      selectedRecipeId: null,

      // Initial UI state
      isEditing: false,
      isCreating: false,
      searchTerm: "",
      filterCategory: null,
      isLoading: false,

      // Recipe CRUD operations
      createRecipe: (recipeData) => {
        const now = new Date();
        const newRecipe: Recipe = {
          id: crypto.randomUUID(),
          dateCreated: now,
          dateModified: now,
          ...recipeData,
        };

        set((state) => ({
          recipes: [...state.recipes, newRecipe],
          selectedRecipeId: newRecipe.id,
          isCreating: false,
        }));
      },

      updateRecipe: (id, recipeData) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  ...recipeData,
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
          selectedRecipeId:
            state.selectedRecipeId === id ? null : state.selectedRecipeId,
        }));
      },

      // Ingredient management
      addIngredient: (recipeId, ingredientData) => {
        const newIngredient: Ingredient = {
          id: crypto.randomUUID(),
          ...ingredientData,
        };

        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  ingredients: [...recipe.ingredients, newIngredient],
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      updateIngredient: (recipeId, ingredientId, data) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  ingredients: recipe.ingredients.map((ingredient) =>
                    ingredient.id === ingredientId
                      ? { ...ingredient, ...data }
                      : ingredient
                  ),
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      removeIngredient: (recipeId, ingredientId) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  ingredients: recipe.ingredients.filter(
                    (ingredient) => ingredient.id !== ingredientId
                  ),
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      // Instruction management
      addInstruction: (recipeId, instructionData) => {
        const newInstruction: Instruction = {
          id: crypto.randomUUID(),
          ...instructionData,
        };

        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  instructions: [...recipe.instructions, newInstruction],
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      updateInstruction: (recipeId, instructionId, data) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  instructions: recipe.instructions.map((instruction) =>
                    instruction.id === instructionId
                      ? { ...instruction, ...data }
                      : instruction
                  ),
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      removeInstruction: (recipeId, instructionId) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  instructions: recipe.instructions.filter(
                    (instruction) => instruction.id !== instructionId
                  ),
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },

      // UI actions
      selectRecipe: (id) => {
        set({
          selectedRecipeId: id,
          isEditing: false,
        });
      },

      startEditing: () => {
        set({ isEditing: true });
      },

      finishEditing: () => {
        set({ isEditing: false });
      },

      startCreating: () => {
        set({
          isCreating: true,
          selectedRecipeId: null,
        });
      },

      cancelCreating: () => {
        set({ isCreating: false });
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category });
      },

      // Utility actions
      toggleFavorite: (id) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  isFavorite: !recipe.isFavorite,
                  dateModified: new Date(),
                }
              : recipe
          ),
        }));
      },
    }),
    {
      // Keepsync configuration
      docId: "recipe-collection",
    }
  )
);

/**
 * Helper selectors for common data retrieval patterns
 */
export const getSelectedRecipe = (state: RecipeStore) =>
  state.selectedRecipeId
    ? state.recipes.find((r) => r.id === state.selectedRecipeId)
    : null;

export const getFilteredRecipes = (state: RecipeStore) => {
  let filtered = state.recipes;

  // Apply search filter
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(term) ||
        recipe.description.toLowerCase().includes(term)
    );
  }

  // Apply category filter
  if (state.filterCategory) {
    filtered = filtered.filter((recipe) =>
      recipe.category.includes(state.filterCategory!)
    );
  }

  return filtered;
};

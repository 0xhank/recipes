import { Clipboard, PlusCircle, Trash2 } from "lucide-react"; // Icons for buttons
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ingredient,
  Instruction,
  Recipe,
  useRecipeStore,
} from "../stores/recipeStore";

// Type for ingredient state within the form (allowing empty amount)
type FormIngredient = Omit<Ingredient, "amount" | "id"> & {
  id: string; // Temporary client-side ID
  amount: number | "";
};

// Type for instruction state within the form
type FormInstruction = Omit<Instruction, "id" | "stepNumber"> & {
  id: string; // Temporary client-side ID
};

// Type for the expected JSON structure (excluding generated fields)
type RecipeJsonInput = Omit<
  Recipe,
  "id" | "dateCreated" | "dateModified" | "ingredients" | "instructions"
> & {
  ingredients: Array<Omit<Ingredient, "id">>;
  instructions: Array<Omit<Instruction, "id" | "stepNumber">>;
};

// LLM Prompt Text - Correctly escaped backticks for code fences
const llmPromptText = `Generate a JSON object representing a recipe, suitable for direct use in my application. The JSON should conform to the following TypeScript type, omitting the 'id', 'dateCreated', and 'dateModified' fields which are generated automatically:

\`\`\`typescript
type RecipeInput = {
  title: string;
  description: string;
  prepTime: number; // In minutes
  cookTime: number; // In minutes
  servings: number;
  category: string[]; // Array of relevant categories (e.g., ["Dessert", "Baking"])
  cuisine: string; // e.g., "American", "Italian"
  difficulty: "easy" | "medium" | "hard";
  author: string;
  imageUrl?: string; // Optional URL
  notes?: string; // Optional additional notes
  isFavorite?: boolean; // Optional, defaults to false
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    preparation?: string; // Optional (e.g., "finely chopped")
  }>;
  instructions: Array<{
    text: string; // The instruction text for a single step
  }>;
  // nutrition?: { calories: number; protein: number; carbs: number; fat: number; sugar?: number; sodium?: number; fiber?: number; }; // Optional nutrition info
};
\`\`\`

Ensure all required fields are present and values have the correct types. For example:

\`\`\`json
{
  "title": "Example Chocolate Cake",
  "description": "A delicious and easy chocolate cake.",
  "prepTime": 20,
  "cookTime": 40,
  "servings": 8,
  "category": ["Dessert", "Cake", "Baking"],
  "cuisine": "American",
  "difficulty": "medium",
  "author": "Chef Assistant",
  "imageUrl": "https://example.com/cake.jpg",
  "notes": "Best served warm with vanilla ice cream.",
  "ingredients": [
    { "name": "All-purpose flour", "amount": 2, "unit": "cups", "preparation": "sifted" },
    { "name": "Sugar", "amount": 1.5, "unit": "cups" },
    { "name": "Cocoa powder", "amount": 0.75, "unit": "cup" },
    { "name": "Large eggs", "amount": 2, "unit": "" }
  ],
  "instructions": [
    { "text": "Preheat oven to 350°F (175°C)." },
    { "text": "Grease and flour two 9-inch round cake pans." }
  ]
}
\`\`\`

Please provide *only* the JSON object in your response.
`;

/**
 * A component for creating new recipes manually via a form or by importing JSON.
 */
const CreateRecipeForm: React.FC = () => {
  const createRecipe = useRecipeStore((state) => state.createRecipe);
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState<number | "">("");
  const [cookTime, setCookTime] = useState<number | "">("");
  const [servings, setServings] = useState<number | "">("");
  const [category, setCategory] = useState(""); // Comma-separated string
  const [cuisine, setCuisine] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [ingredients, setIngredients] = useState<FormIngredient[]>([]);
  const [instructions, setInstructions] = useState<FormInstruction[]>([]);

  // State for JSON import
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  // State for LLM prompt customization
  const [llmRecipeName, setLlmRecipeName] = useState("");
  const [llmRecipeDescription, setLlmRecipeDescription] = useState("");
  const [llmIngredients, setLlmIngredients] = useState("");

  // State for active tab
  const [creationMode, setCreationMode] = useState<"manual" | "llm">("llm"); // Default to LLM tab

  // --- Ingredient Handlers ---
  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: crypto.randomUUID(), // Temporary ID
        name: "",
        amount: "",
        unit: "",
        preparation: "",
      },
    ]);
  };

  const handleIngredientChange = (
    id: string,
    field: keyof FormIngredient,
    value: string | number
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // --- Instruction Handlers ---
  const handleAddInstruction = () => {
    setInstructions([...instructions, { id: crypto.randomUUID(), text: "" }]);
  };

  const handleInstructionChange = (id: string, value: string) => {
    setInstructions(
      instructions.map((inst) =>
        inst.id === id ? { ...inst, text: value } : inst
      )
    );
  };

  const handleRemoveInstruction = (id: string) => {
    setInstructions(instructions.filter((inst) => inst.id !== id));
  };

  // --- JSON Import Handler ---
  const handleJsonParse = () => {
    setJsonError(null);
    if (!jsonInput.trim()) {
      setJsonError("Please paste JSON data into the text area.");
      return;
    }

    try {
      const parsedData = JSON.parse(jsonInput) as Partial<RecipeJsonInput>;

      // Basic validation (can be expanded)
      if (!parsedData.title) throw new Error("Missing required field: title");
      if (!parsedData.ingredients || !Array.isArray(parsedData.ingredients))
        throw new Error("Missing or invalid field: ingredients");
      if (!parsedData.instructions || !Array.isArray(parsedData.instructions))
        throw new Error("Missing or invalid field: instructions");

      // Populate form state - use || '' or || 0 for type safety if fields might be missing
      setTitle(parsedData.title || "");
      setDescription(parsedData.description || "");
      setPrepTime(parsedData.prepTime || "");
      setCookTime(parsedData.cookTime || "");
      setServings(parsedData.servings || "");
      setCategory((parsedData.category || []).join(", "));
      setCuisine(parsedData.cuisine || "");
      setDifficulty(parsedData.difficulty || "easy");
      setAuthor(parsedData.author || "");
      setImageUrl(parsedData.imageUrl || "");
      setNotes(parsedData.notes || "");

      setIngredients(
        (parsedData.ingredients || []).map((ing) => ({
          id: crypto.randomUUID(), // Generate temporary ID
          name: ing.name || "",
          amount: ing.amount ?? "", // Use ?? to handle 0 correctly
          unit: ing.unit || "",
          preparation: ing.preparation || "",
        }))
      );

      setInstructions(
        (parsedData.instructions || []).map((inst) => ({
          id: crypto.randomUUID(), // Generate temporary ID
          text: inst.text || "",
        }))
      );

      setJsonInput(""); // Clear input on success
      alert("Form populated successfully from JSON!");
      setCreationMode("manual"); // Switch back to manual view to show populated fields
    } catch (error: any) {
      console.error("Error parsing JSON:", error);
      setJsonError(
        `Failed to parse JSON: ${error.message}. Please check the format and required fields.`
      );
    }
  };

  // --- Dynamic LLM Prompt Generation ---
  const generateLlmPrompt = () => {
    const nameInstruction = llmRecipeName.trim()
      ? `The recipe should be specifically for: "${llmRecipeName.trim()}".`
      : "";
    const descriptionInstruction = llmRecipeDescription.trim()
      ? `Use the following description as a guide: "${llmRecipeDescription.trim()}".`
      : "";
    const ingredientsInstruction = llmIngredients.trim()
      ? `The recipe must include the following ingredients (or suitable substitutes if necessary): ${llmIngredients.trim()}.`
      : "";

    const customizationNote = [nameInstruction, descriptionInstruction, ingredientsInstruction]
      .filter(Boolean)
      .join(" ");

    const fullCustomization = customizationNote
      ? `\n\n${customizationNote}\n`
      : "";

    // Original prompt text structure
    return `Generate a JSON object representing a recipe, suitable for direct use in my application. The JSON should conform to the following TypeScript type, omitting the 'id', 'dateCreated', and 'dateModified' fields which are generated automatically:

\`\`\`typescript
type RecipeInput = {
  title: string;
  description: string;
  prepTime: number; // In minutes
  cookTime: number; // In minutes
  servings: number;
  category: string[]; // Array of relevant categories (e.g., ["Dessert", "Baking"])
  cuisine: string; // e.g., "American", "Italian"
  difficulty: "easy" | "medium" | "hard";
  author: string;
  imageUrl?: string; // Optional URL
  notes?: string; // Optional additional notes
  isFavorite?: boolean; // Optional, defaults to false
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    preparation?: string; // Optional (e.g., "finely chopped")
  }>;
  instructions: Array<{
    text: string; // The instruction text for a single step
  }>;
  // nutrition?: { calories: number; protein: number; carbs: number; fat: number; sugar?: number; sodium?: number; fiber?: number; }; // Optional nutrition info
};
\`\`\`
${fullCustomization}
Ensure all required fields are present and values have the correct types. For example:

\`\`\`json
{
  "title": "Example Chocolate Cake",
  "description": "A delicious and easy chocolate cake.",
  "prepTime": 20,
  "cookTime": 40,
  "servings": 8,
  "category": ["Dessert", "Cake", "Baking"],
  "cuisine": "American",
  "difficulty": "medium",
  "author": "Chef Assistant",
  "imageUrl": "https://example.com/cake.jpg",
  "notes": "Best served warm with vanilla ice cream.",
  "ingredients": [
    { "name": "All-purpose flour", "amount": 2, "unit": "cups", "preparation": "sifted" },
    { "name": "Sugar", "amount": 1.5, "unit": "cups" },
    { "name": "Cocoa powder", "amount": 0.75, "unit": "cup" },
    { "name": "Large eggs", "amount": 2, "unit": "" }
  ],
  "instructions": [
    { "text": "Preheat oven to 350°F (175°C)." },
    { "text": "Grease and flour two 9-inch round cake pans." }
  ]
}
\`\`\`

Please provide *only* the JSON object in your response.
`;
  };

  // --- Copy LLM Prompt ---
  const handleCopyPrompt = async () => {
    const dynamicPrompt = generateLlmPrompt(); // Generate the prompt with current name/description
    try {
      await navigator.clipboard.writeText(dynamicPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy prompt to clipboard.");
    }
  };

  // --- Form Submission ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!title.trim()) {
      alert("Please enter a recipe title.");
      return;
    }
    if (ingredients.length === 0 || ingredients.some((i) => !i.name.trim())) {
      alert("Please add at least one ingredient with a name.");
      return;
    }
    if (instructions.length === 0 || instructions.some((i) => !i.text.trim())) {
      alert("Please add at least one instruction step.");
      return;
    }

    try {
      const recipeData: Omit<Recipe, "id" | "dateCreated" | "dateModified"> = {
        title: title.trim(),
        description: description.trim(),
        prepTime: Number(prepTime) || 0,
        cookTime: Number(cookTime) || 0,
        servings: Number(servings) || 1,
        category: category
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        cuisine: cuisine.trim(),
        difficulty,
        author: author.trim() || "Unknown Chef",
        imageUrl: imageUrl.trim(),
        notes: notes.trim(),
        isFavorite: false, // Default value
        ingredients: ingredients.map(({ id: _tempId, ...ing }) => ({
          // Exclude temp ID and generate final ID
          id: crypto.randomUUID(),
          ...ing,
          amount: Number(ing.amount) || 0, // Ensure amount is a number
          preparation: ing.preparation?.trim(),
        })),
        instructions: instructions.map(({ id: _tempId, ...inst }, index) => ({
          // Exclude temp ID, add stepNumber, and generate final ID
          id: crypto.randomUUID(),
          ...inst,
          stepNumber: index + 1,
          text: inst.text.trim(),
        })),
      };

      createRecipe(recipeData);
      alert("Recipe created successfully!");
      navigate("/"); // Navigate back to the splash page
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert(
        "Oh dear, something went wrong while saving the recipe. Please check the details and try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-wash p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-primary mb-6 text-center font-serif">
          Create a New Recipe
        </h1>
        <p className="text-center text-neutral mb-8">
          Choose your method: enter details manually or import from generated JSON.
        </p>

        {/* --- Tab Navigation --- */}
        <div className="mb-6 flex border-b border-neutral-light">
          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            className={`py-2 px-4 font-medium ${
              creationMode === "manual"
                ? "border-b-2 border-primary text-primary"
                : "text-neutral hover:text-primary-dark"
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setCreationMode("llm")}
            className={`py-2 px-4 font-medium ${
              creationMode === "llm"
                ? "border-b-2 border-primary text-primary"
                : "text-neutral hover:text-primary-dark"
            }`}
          >
            Import using LLM
          </button>
        </div>

        {/* Form structure remains, content is conditional */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* --- Conditional Content: Manual Form --- */}
          {creationMode === "manual" && (
            <>
              {/* --- Basic Info --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Recipe Title <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., Grandma's Apple Pie"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="author"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g., Reginald"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-primary-dark mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="A short summary of the recipe..."
                  className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                />
              </div>

              {/* --- Details Grid --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="prepTime"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    id="prepTime"
                    value={prepTime}
                    onChange={(e) =>
                      setPrepTime(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    min="0"
                    placeholder="e.g., 15"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cookTime"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Cook Time (mins)
                  </label>
                  <input
                    type="number"
                    id="cookTime"
                    value={cookTime}
                    onChange={(e) =>
                      setCookTime(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    min="0"
                    placeholder="e.g., 30"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="servings"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Servings
                  </label>
                  <input
                    type="number"
                    id="servings"
                    value={servings}
                    onChange={(e) =>
                      setServings(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    min="1"
                    placeholder="e.g., 4"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Category (comma-sep.)
                  </label>
                  <input
                    type="text"
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Dessert, Baking, Pie"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cuisine"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Cuisine
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="e.g., American"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as "easy" | "medium" | "hard")
                    }
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-primary-dark mb-1"
                >
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                />
              </div>

              {/* --- Ingredients Section --- */}
              <div className="space-y-4 pt-4 border-t border-neutral">
                <h2 className="text-xl font-semibold text-primary-dark">
                  Ingredients <span className="text-primary">*</span>
                </h2>
                {ingredients.map((ing, index) => (
                  <div
                    key={ing.id}
                    className="flex flex-wrap items-end gap-3 p-3 bg-wash rounded border border-neutral"
                  >
                    <div className="flex-grow min-w-[150px]">
                      <label className="block text-xs font-medium text-gray-600">
                        Name
                      </label>
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) =>
                          handleIngredientChange(ing.id, "name", e.target.value)
                        }
                        required
                        placeholder="Flour"
                        className="w-full mt-1 px-2 py-1 border border-neutral rounded-md shadow-sm text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-medium text-gray-600">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={ing.amount}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.id,
                            "amount",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="2"
                        min="0"
                        step="any"
                        required
                        className="w-full mt-1 px-2 py-1 border border-neutral rounded-md shadow-sm text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-600">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredientChange(ing.id, "unit", e.target.value)
                        }
                        required
                        placeholder="cups"
                        className="w-full mt-1 px-2 py-1 border border-neutral rounded-md shadow-sm text-sm"
                      />
                    </div>
                    <div className="flex-grow min-w-[150px]">
                      <label className="block text-xs font-medium text-gray-600">
                        Preparation (Opt.)
                      </label>
                      <input
                        type="text"
                        value={ing.preparation}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.id,
                            "preparation",
                            e.target.value
                          )
                        }
                        placeholder="sifted"
                        className="w-full mt-1 px-2 py-1 border border-neutral rounded-md shadow-sm text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary text-primary rounded-md hover:bg-primary-lightest"
                >
                  <PlusCircle size={18} />
                  Add Ingredient
                </button>
              </div>

              {/* --- Instructions Section --- */}
              <div className="space-y-4 pt-4 border-t border-neutral">
                <h2 className="text-xl font-semibold text-primary-dark">
                  Instructions <span className="text-primary">*</span>
                </h2>
                {instructions.map((inst, index) => (
                  <div key={inst.id} className="flex items-start gap-3">
                    <span className="mt-2 font-medium text-primary">
                      {index + 1}.
                    </span>
                    <textarea
                      value={inst.text}
                      onChange={(e) =>
                        handleInstructionChange(inst.id, e.target.value)
                      }
                      required
                      rows={2}
                      placeholder="Mix the ingredients..."
                      className="flex-grow px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(inst.id)}
                      className="mt-2 p-2 text-red-600 hover:text-red-800"
                      aria-label="Remove instruction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary text-primary rounded-md hover:bg-primary-lightest"
                >
                  <PlusCircle size={18} />
                  Add Instruction Step
                </button>
              </div>

              {/* --- Optional Notes --- */}
              <div className="pt-4 border-t border-neutral">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-primary-dark mb-1"
                >
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any extra tips or variations..."
                  className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                />
              </div>
            </>
          )}

          {/* --- Conditional Content: LLM Import --- */}
          {creationMode === "llm" && (
            <div className="space-y-6">
              {/* --- LLM Customization Inputs --- */}
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="llmRecipeName"
                      className="block text-sm font-medium text-primary-dark mb-1"
                    >
                      Recipe Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="llmRecipeName"
                      value={llmRecipeName}
                      onChange={(e) => setLlmRecipeName(e.target.value)}
                      placeholder="e.g., Spicy Tomato Pasta"
                      className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="llmRecipeDescription"
                      className="block text-sm font-medium text-primary-dark mb-1"
                    >
                      Brief Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="llmRecipeDescription"
                      value={llmRecipeDescription}
                      onChange={(e) => setLlmRecipeDescription(e.target.value)}
                      placeholder="e.g., A quick weeknight meal"
                      className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                    />
                  </div>
                </div>

                {/* Ingredient Input */}
                <div>
                  <label
                    htmlFor="llmIngredients"
                    className="block text-sm font-medium text-primary-dark mb-1"
                  >
                    Must-Have Ingredients (Optional, comma-separated or one per line)
                  </label>
                  <textarea
                    id="llmIngredients"
                    value={llmIngredients}
                    onChange={(e) => setLlmIngredients(e.target.value)}
                    rows={3}
                    placeholder="e.g., chicken breast, broccoli, garlic"
                    className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral"
                  />
                </div>
              </div>

              {/* --- LLM Prompt Display --- */}
              <div className="pb-4">
                <label className="block text-sm font-medium text-primary-dark mb-2">
                  Copy and Paste the below LLM Prompt into your ChatGPT or other LLM to generate a JSON object representing a recipe.
                </label>
                <div className="relative bg-gray-100 p-3 rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {generateLlmPrompt()}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    aria-label="Copy prompt"
                  >
                    {promptCopied ? (
                      <span className="text-xs text-green-600">Copied!</span>
                    ) : (
                      <Clipboard size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* --- JSON Input Area --- */}
              <div>
                <label
                  htmlFor="jsonInput"
                  className="block text-sm font-medium text-primary-dark mb-1"
                >
                  Paste Generated Recipe JSON Here:
                </label>
                <textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={8}
                  placeholder={'{\n  "title": "My Recipe",\n  "ingredients": [...],\n  ...\n}'}
                  className="w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral font-mono text-sm"
                />
                {jsonError && (
                  <p className="mt-2 text-sm text-red-600">{jsonError}</p>
                )}
                <button
                  type="button"
                  onClick={handleJsonParse}
                  className="mt-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Parse JSON & Fill Form
                </button>
                <p className="mt-2 text-sm text-neutral">
                  Parsing the JSON will populate the fields and switch you to the Manual Entry tab for review before saving.
                </p>
              </div>
            </div>
          )}

          {/* --- Submit Button (Always Visible) --- */}
          <div className="pt-4 border-t border-neutral-light">
            <button
              type="submit"
              disabled={creationMode === "llm"}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition-colors ${
                creationMode === "llm" ? 'bg-neutral-light cursor-not-allowed' : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              }`}
            >
              Save Recipe
            </button>
            {creationMode === "llm" && (
                <p className="mt-2 text-center text-sm text-neutral">
                    Please parse the JSON first. The form will switch to Manual Entry for review.
                </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
};

// Ensure the component name matches the file name if it's the default export
export { CreateRecipeForm as default };

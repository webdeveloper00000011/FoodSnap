export interface FoodIngredient {
  name: string;
  amount: string;
  role: string;
}

export interface NutritionEstimate {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
}

export interface FoodAnalysisResult {
  isFood: boolean;
  foodName: string;
  cuisineOrCategory: string;
  description: string;
  servingEstimate: string;
  confidence: 'High' | 'Medium' | 'Low';
  ingredients: FoodIngredient[];
  nutrition: NutritionEstimate;
  dietaryNotes: string[];
  nonFoodReason?: string;
}

export interface FoodScanRecord {
  id: string;
  scannedAt: string;
  thumbnailDataUrl: string;
  analysis: FoodAnalysisResult;
}

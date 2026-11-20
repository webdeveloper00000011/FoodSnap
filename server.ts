import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const SYSTEM_INSTRUCTION = `You are FoodSnap, an expert culinary and nutritional visual analyst.
Analyze the provided image carefully:
1. Determine whether the image actually shows food, a meal, a beverage, or edible ingredients. If it does not show food (e.g., a laptop, landscape, person, empty plate, blurry unrecognizable object), set isFood to false, provide a brief friendly explanation in nonFoodReason, and return empty/zero fallback values for the remaining fields.
2. When it is food, identify the specific dish or food item accurately (foodName) along with its cuisine or category (cuisineOrCategory), a concise 2-3 sentence appetizing description covering visual preparation and components (description), a realistic visual serving size estimate (servingEstimate), and your visual confidence level (High, Medium, or Low).
3. List all plausible visible and foundational ingredients (ingredients) with an estimated portion (amount) and culinary role (e.g., "Base grain", "Protein", "Dressing & seasoning", "Fresh topping").
4. Estimate realistic macro and micronutrients (nutrition) for the visible portion shown in the image: calories (kcal), proteinGrams, carbsGrams, fatGrams, fiberGrams, sugarGrams, sodiumMg.
5. Add 1 to 4 concise dietary notes when relevant (e.g., "Vegetarian", "High Protein", "Contains Dairy", "Gluten-Free"). Do not invent fake health scores.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isFood: {
      type: Type.BOOLEAN,
      description: 'True if the image depicts food, drinks, or edible items; false otherwise.',
    },
    nonFoodReason: {
      type: Type.STRING,
      description: 'Friendly explanation if isFood is false.',
    },
    foodName: {
      type: Type.STRING,
      description: 'Identified name of the dish or food item.',
    },
    cuisineOrCategory: {
      type: Type.STRING,
      description: 'Cuisine style or meal category, e.g., Mediterranean Grain Bowl or Japanese Ramen.',
    },
    description: {
      type: Type.STRING,
      description: '2-3 sentences describing the dish, preparation method, and visual highlights.',
    },
    servingEstimate: {
      type: Type.STRING,
      description: 'Estimated serving size visible in the photo, e.g., 1 bowl (~360g).',
    },
    confidence: {
      type: Type.STRING,
      description: 'Confidence level: High, Medium, or Low.',
    },
    ingredients: {
      type: Type.ARRAY,
      description: 'Possible ingredients visible or typically included in this dish.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Ingredient name.' },
          amount: { type: Type.STRING, description: 'Estimated quantity or portion.' },
          role: { type: Type.STRING, description: 'Role in the dish, e.g., Base, Protein, Garnish.' },
        },
        required: ['name', 'amount', 'role'],
      },
    },
    nutrition: {
      type: Type.OBJECT,
      description: 'Estimated nutrition information for the visible serving.',
      properties: {
        calories: { type: Type.INTEGER, description: 'Estimated calories in kcal.' },
        proteinGrams: { type: Type.NUMBER, description: 'Estimated protein in grams.' },
        carbsGrams: { type: Type.NUMBER, description: 'Estimated carbohydrates in grams.' },
        fatGrams: { type: Type.NUMBER, description: 'Estimated total fat in grams.' },
        fiberGrams: { type: Type.NUMBER, description: 'Estimated dietary fiber in grams.' },
        sugarGrams: { type: Type.NUMBER, description: 'Estimated sugar in grams.' },
        sodiumMg: { type: Type.INTEGER, description: 'Estimated sodium in milligrams.' },
      },
      required: [
        'calories',
        'proteinGrams',
        'carbsGrams',
        'fatGrams',
        'fiberGrams',
        'sugarGrams',
        'sodiumMg',
      ],
    },
    dietaryNotes: {
      type: Type.ARRAY,
      description: 'Concise dietary characteristics or allergen notes.',
      items: { type: Type.STRING },
    },
  },
  required: [
    'isFood',
    'foodName',
    'cuisineOrCategory',
    'description',
    'servingEstimate',
    'confidence',
    'ingredients',
    'nutrition',
    'dietaryNotes',
  ],
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze-food', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Please provide a valid food image to analyze.' });
        return;
      }

      const normalizedMime =
        typeof mimeType === 'string' && mimeType.startsWith('image/')
          ? mimeType
          : 'image/jpeg';

      const cleanBase64 = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      if (!cleanBase64 || cleanBase64.length < 32) {
        res.status(400).json({ error: 'The uploaded image data appears incomplete.' });
        return;
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: cleanBase64,
              },
            },
            {
              text: 'Identify the food in this photo, describe it clearly, list the possible ingredients, and estimate the nutrition values for the visible serving.',
            },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty analysis. Please try another photo.' });
        return;
      }

      const parsed = JSON.parse(rawText);

      // Normalize confidence value cleanly
      const confidence =
        parsed.confidence === 'High' || parsed.confidence === 'Medium' || parsed.confidence === 'Low'
          ? parsed.confidence
          : 'Medium';

      res.json({
        ...parsed,
        confidence,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        dietaryNotes: Array.isArray(parsed.dietaryNotes) ? parsed.dietaryNotes : [],
        nutrition: {
          calories: Math.max(0, Math.round(Number(parsed.nutrition?.calories) || 0)),
          proteinGrams: Math.max(0, Math.round((Number(parsed.nutrition?.proteinGrams) || 0) * 10) / 10),
          carbsGrams: Math.max(0, Math.round((Number(parsed.nutrition?.carbsGrams) || 0) * 10) / 10),
          fatGrams: Math.max(0, Math.round((Number(parsed.nutrition?.fatGrams) || 0) * 10) / 10),
          fiberGrams: Math.max(0, Math.round((Number(parsed.nutrition?.fiberGrams) || 0) * 10) / 10),
          sugarGrams: Math.max(0, Math.round((Number(parsed.nutrition?.sugarGrams) || 0) * 10) / 10),
          sodiumMg: Math.max(0, Math.round(Number(parsed.nutrition?.sodiumMg) || 0)),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      console.error('FoodSnap analysis error:', error);

      if (message.includes('GEMINI_API_KEY')) {
        res.status(500).json({
          error: 'Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
        res.status(403).json({
          error: 'Unable to authenticate with Gemini AI. Please verify your API key in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({
        error: 'Could not analyze this food photo right now. Please try again.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FoodSnap server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

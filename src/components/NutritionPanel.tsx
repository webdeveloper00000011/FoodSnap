import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Flame, Leaf, RotateCcw, Utensils } from 'lucide-react';
import type { FoodAnalysisResult } from '../types/food';

interface NutritionPanelProps {
  analysis: FoodAnalysisResult;
  imageUrl: string;
  scannedAt?: string;
  onClear: () => void;
  clearLabel?: string;
}

function formatMacroPercent(grams: number, kcalPerGram: number, totalMacroCalories: number): number {
  if (totalMacroCalories <= 0) return 0;
  return Math.min(100, Math.round(((grams * kcalPerGram) / totalMacroCalories) * 100));
}

export const NutritionPanel: React.FC<NutritionPanelProps> = ({
  analysis,
  imageUrl,
  scannedAt,
  onClear,
  clearLabel = 'Clear & Scan Another Food',
}) => {
  const { nutrition } = analysis;
  const proteinCals = nutrition.proteinGrams * 4;
  const carbsCals = nutrition.carbsGrams * 4;
  const fatCals = nutrition.fatGrams * 9;
  const totalMacroCalories = proteinCals + carbsCals + fatCals;

  const proteinPct = formatMacroPercent(nutrition.proteinGrams, 4, totalMacroCalories);
  const carbsPct = formatMacroPercent(nutrition.carbsGrams, 4, totalMacroCalories);
  const fatPct = formatMacroPercent(nutrition.fatGrams, 9, totalMacroCalories);

  // SVG Donut ring geometry
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const proteinArc = totalMacroCalories > 0 ? (proteinCals / totalMacroCalories) * ringCircumference : 0;
  const carbsArc = totalMacroCalories > 0 ? (carbsCals / totalMacroCalories) * ringCircumference : 0;
  const fatArc = totalMacroCalories > 0 ? (fatCals / totalMacroCalories) * ringCircumference : 0;

  const formattedDate = scannedAt
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(scannedAt))
    : null;

  if (!analysis.isFood) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
      >
        <div className="lg:col-span-5">
          <div className="rounded-3xl overflow-hidden border border-cream-border bg-cream-card card-soft-shadow aspect-[4/3]">
            <img
              src={imageUrl}
              alt="Captured photo preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7 bg-cream-card border border-cream-border rounded-3xl p-6 sm:p-8 card-soft-shadow space-y-5">
          <div className="inline-flex items-center gap-2 text-apricot-600 text-sm font-semibold">
            <AlertCircle className="w-5 h-5" />
            <span>No food detected in this photo</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-balance">
            Let&apos;s try a clearer food photo
          </h2>
          <p className="text-base text-ink-muted leading-relaxed">
            {analysis.nonFoodReason ||
              'FoodSnap works best with a close-up photo of a meal, snack, beverage, or fresh ingredients.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClear}
              className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-2xl bg-apricot-500 hover:bg-apricot-600 active:scale-[0.99] text-white font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              {clearLabel}
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
    >
      {/* Left column: Photo + Clear CTA */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        <div className="rounded-3xl overflow-hidden border border-cream-border bg-cream-card card-soft-shadow aspect-[4/3]">
          <img
            src={imageUrl}
            alt={analysis.foodName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <button
          type="button"
          onClick={onClear}
          className="min-h-[50px] w-full px-6 py-3 rounded-2xl bg-apricot-500 hover:bg-apricot-600 active:scale-[0.99] text-white font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 card-soft-shadow whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apricot-600"
        >
          <RotateCcw className="w-4 h-4" />
          {clearLabel}
        </button>
      </div>

      {/* Right column: Dish overview, Nutrition, Possible Ingredients */}
      <div className="lg:col-span-7 space-y-6">
        {/* Dish Identity Panel */}
        <div className="bg-cream-card border border-cream-border rounded-3xl p-6 sm:p-8 card-soft-shadow space-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-muted">
            <span className="text-sage-800 font-semibold">{analysis.cuisineOrCategory}</span>
            <span aria-hidden="true">·</span>
            <span>{analysis.servingEstimate}</span>
            <span aria-hidden="true">·</span>
            <span>{analysis.confidence} confidence</span>
            {formattedDate && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-4xl font-bold text-ink tracking-tight text-balance">
            {analysis.foodName}
          </h2>

          <p className="text-base text-ink-muted leading-relaxed">{analysis.description}</p>

          {analysis.dietaryNotes.length > 0 && (
            <div className="pt-3 border-t border-cream-border flex items-start gap-2 text-sm text-sage-800">
              <Leaf className="w-4 h-4 mt-0.5 shrink-0 text-sage-600" aria-hidden="true" />
              <p className="leading-snug">{analysis.dietaryNotes.join(' · ')}</p>
            </div>
          )}
        </div>

        {/* Estimated Nutrition Breakdown */}
        <div className="bg-cream-card border border-cream-border rounded-3xl p-6 sm:p-8 card-soft-shadow space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Estimated Nutrition
              </h3>
              <p className="text-xs text-ink-muted">
                Visual estimate for {analysis.servingEstimate}
              </p>
              <div className="inline-flex items-baseline gap-1.5 pt-2">
                <Flame className="w-4 h-4 text-apricot-500 self-center" aria-hidden="true" />
                <span className="font-display text-3xl sm:text-4xl font-bold text-ink tabular-nums">
                  {nutrition.calories}
                </span>
                <span className="text-sm font-semibold text-apricot-600">kcal</span>
              </div>
            </div>

            {/* Macro Balance Donut Ring */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 80 80"
                className="w-20 h-20 -rotate-90"
                role="img"
                aria-label={`Macro balance: ${proteinPct}% protein, ${carbsPct}% carbs, ${fatPct}% fat`}
              >
                <circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  fill="none"
                  stroke="#F2ECE0"
                  strokeWidth="9"
                />
                {totalMacroCalories > 0 && (
                  <>
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      fill="none"
                      stroke="#3D8A51"
                      strokeWidth="9"
                      strokeDasharray={`${proteinArc} ${ringCircumference}`}
                      strokeDashoffset={0}
                      strokeLinecap="butt"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      fill="none"
                      stroke="#E06528"
                      strokeWidth="9"
                      strokeDasharray={`${carbsArc} ${ringCircumference}`}
                      strokeDashoffset={-proteinArc}
                      strokeLinecap="butt"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      fill="none"
                      stroke="#F28C52"
                      strokeWidth="9"
                      strokeOpacity="0.55"
                      strokeDasharray={`${fatArc} ${ringCircumference}`}
                      strokeDashoffset={-(proteinArc + carbsArc)}
                      strokeLinecap="butt"
                    />
                  </>
                )}
              </svg>
              <span className="absolute text-[10px] font-semibold text-ink-muted">Macros</span>
            </div>
          </div>

          {/* Primary Macros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-sage-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-sage-800">Protein</span>
                <span className="text-xs text-ink-muted tabular-nums">{proteinPct}%</span>
              </div>
              <p className="font-mono text-xl font-semibold text-ink tabular-nums">
                {nutrition.proteinGrams}g
              </p>
              <div className="h-1.5 rounded-full bg-sage-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sage-600 transition-all duration-300"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>

            <div className="bg-apricot-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-apricot-900">Carbs</span>
                <span className="text-xs text-ink-muted tabular-nums">{carbsPct}%</span>
              </div>
              <p className="font-mono text-xl font-semibold text-ink tabular-nums">
                {nutrition.carbsGrams}g
              </p>
              <div className="h-1.5 rounded-full bg-apricot-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-apricot-500 transition-all duration-300"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>

            <div className="bg-cream-muted rounded-2xl p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-ink">Fat</span>
                <span className="text-xs text-ink-muted tabular-nums">{fatPct}%</span>
              </div>
              <p className="font-mono text-xl font-semibold text-ink tabular-nums">
                {nutrition.fatGrams}g
              </p>
              <div className="h-1.5 rounded-full bg-cream-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-apricot-400 transition-all duration-300"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Micros */}
          <div className="grid grid-cols-3 divide-x divide-cream-border pt-3 border-t border-cream-border text-center sm:text-left">
            <div className="pr-3">
              <p className="text-xs text-ink-muted">Dietary Fiber</p>
              <p className="font-mono text-base font-semibold text-ink tabular-nums mt-0.5">
                {nutrition.fiberGrams}g
              </p>
            </div>
            <div className="px-3">
              <p className="text-xs text-ink-muted">Sugars</p>
              <p className="font-mono text-base font-semibold text-ink tabular-nums mt-0.5">
                {nutrition.sugarGrams}g
              </p>
            </div>
            <div className="pl-3">
              <p className="text-xs text-ink-muted">Sodium</p>
              <p className="font-mono text-base font-semibold text-ink tabular-nums mt-0.5">
                {nutrition.sodiumMg}mg
              </p>
            </div>
          </div>
        </div>

        {/* Possible Ingredients */}
        <div className="bg-cream-card border border-cream-border rounded-3xl p-6 sm:p-8 card-soft-shadow space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Utensils className="w-5 h-5 text-sage-600" aria-hidden="true" />
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Possible Ingredients
              </h3>
            </div>
            <span className="text-xs font-medium text-ink-muted tabular-nums">
              {analysis.ingredients.length} spotted
            </span>
          </div>

          {analysis.ingredients.length === 0 ? (
            <p className="text-sm text-ink-muted">No individual ingredients could be isolated.</p>
          ) : (
            <ul className="divide-y divide-cream-border">
              {analysis.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-baseline justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{ingredient.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{ingredient.role}</p>
                  </div>
                  <span className="font-mono text-xs font-medium text-sage-800 whitespace-nowrap shrink-0 tabular-nums">
                    {ingredient.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
};

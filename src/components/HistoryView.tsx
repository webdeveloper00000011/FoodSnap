import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Camera, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import type { FoodScanRecord } from '../types/food';

interface HistoryViewProps {
  records: FoodScanRecord[];
  onSelectRecord: (record: FoodScanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAllHistory: () => void;
  onGoToScanner: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAllHistory,
  onGoToScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) => {
      const nameMatch = record.analysis.foodName.toLowerCase().includes(q);
      const cuisineMatch = record.analysis.cuisineOrCategory.toLowerCase().includes(q);
      const ingredientMatch = record.analysis.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(q)
      );
      return nameMatch || cuisineMatch || ingredientMatch;
    });
  }, [records, searchQuery]);

  const { averageCalories, averageProtein } = useMemo(() => {
    if (records.length === 0) return { averageCalories: 0, averageProtein: 0 };
    const calSum = records.reduce((acc, item) => acc + (item.analysis.nutrition.calories || 0), 0);
    const proSum = records.reduce((acc, item) => acc + (item.analysis.nutrition.proteinGrams || 0), 0);
    return {
      averageCalories: Math.round(calSum / records.length),
      averageProtein: Math.round(proSum / records.length),
    };
  }, [records]);

  const formatTimestamp = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return '';
    }
  };

  if (records.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-cream-card border border-cream-border rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto card-soft-shadow space-y-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center mx-auto">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-balance">
            Your food journal is ready
          </h2>
          <p className="text-sm sm:text-base text-ink-muted max-w-md mx-auto leading-relaxed">
            Every meal you snap is automatically saved here so you can revisit ingredients and nutrition estimates anytime.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToScanner}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-apricot-500 hover:bg-apricot-600 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" />
            Scan Your First Meal
          </button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header + Clear Control */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-ink tracking-tight">
            Food Scan History
          </h1>
          <p className="text-sm text-ink-muted">
            Tap any meal to revisit ingredients and nutrition estimates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!confirmClearAll ? (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-cream-border bg-cream-card text-xs font-semibold text-ink-muted hover:text-apricot-600 hover:border-apricot-200 transition-colors whitespace-nowrap shrink-0"
            >
              Clear History
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearAllHistory();
                  setConfirmClearAll(false);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-apricot-500 text-white text-xs font-semibold hover:bg-apricot-600 transition-colors whitespace-nowrap shrink-0"
              >
                Confirm Clear All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-cream-border bg-cream-card text-xs font-semibold text-ink-muted hover:text-ink transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editorial 3-Metric Summary Strip */}
      <div className="bg-cream-card border border-cream-border rounded-3xl p-5 sm:p-6 card-soft-shadow grid grid-cols-3 divide-x divide-cream-border">
        <div className="pr-4">
          <p className="text-xs font-medium text-ink-muted">Meals Logged</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink tabular-nums mt-0.5">
            {records.length}
          </p>
        </div>
        <div className="px-4">
          <p className="text-xs font-medium text-ink-muted">Avg Calories</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-apricot-600 tabular-nums mt-0.5">
            {averageCalories}
            <span className="text-xs font-sans font-medium text-ink-muted ml-1">kcal</span>
          </p>
        </div>
        <div className="pl-4">
          <p className="text-xs font-medium text-ink-muted">Avg Protein</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-sage-800 tabular-nums mt-0.5">
            {averageProtein}
            <span className="text-xs font-sans font-medium text-ink-muted ml-1">g</span>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dishes, cuisines, or ingredients..."
          aria-label="Search food scan history"
          className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-apricot-400"
        />
      </div>

      {/* Filtered Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-cream-card border border-cream-border rounded-3xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-ink">
            No scans match &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-sage-100 text-sage-800 text-xs font-semibold hover:bg-sage-200 transition-colors"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className="group bg-cream-card border border-cream-border rounded-3xl overflow-hidden flex flex-col card-soft-shadow hover:border-apricot-200 transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelectRecord(record)}
                className="text-left flex-1 flex flex-col focus-visible:outline-2 focus-visible:outline-apricot-500"
              >
                <div className="w-full aspect-[4/3] bg-cream-muted overflow-hidden relative">
                  {record.thumbnailDataUrl ? (
                    <img
                      src={record.thumbnailDataUrl}
                      alt={record.analysis.foodName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage-600 bg-sage-50">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-ink-muted tabular-nums">
                      {formatTimestamp(record.scannedAt)} · {record.analysis.cuisineOrCategory}
                    </p>
                    <h3 className="font-display text-lg font-bold text-ink line-clamp-1">
                      {record.analysis.foodName}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {record.analysis.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-cream-border flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-apricot-600 tabular-nums">
                      {record.analysis.nutrition.calories} kcal · {record.analysis.nutrition.proteinGrams}g protein
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sage-800">
                      Details
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </button>

              <div className="px-5 pb-3.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteRecord(record.id)}
                  aria-label={`Delete ${record.analysis.foodName} from history`}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium text-ink-muted hover:text-apricot-600 hover:bg-apricot-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.section>
  );
};

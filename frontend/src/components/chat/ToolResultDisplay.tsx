import { useState } from 'react';
import { Check, X, User, Calendar, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolResult } from '@/types/chat.types';

interface ToolResultDisplayProps {
  results: ToolResult[];
}

/**
 * Labels français pour les tools
 */
const TOOL_LABELS: Record<string, string> = {
  createIntervenant: 'Création intervenant',
  getIntervenants: 'Liste intervenants',
  searchIntervenants: 'Recherche intervenants',
  getIntervenantById: 'Détails intervenant',
  updateIntervenant: 'Mise à jour intervenant',
  deleteIntervenant: 'Suppression intervenant',
  createMission: 'Création mission',
  getMissions: 'Liste missions',
  searchMissions: 'Recherche missions',
  getMissionById: 'Détails mission',
  getUpcomingMissions: 'Missions à venir',
  getUnassignedMissions: 'Missions non assignées',
  getMissionsByIntervenant: 'Missions par intervenant',
  updateMission: 'Mise à jour mission',
  assignMission: 'Assignation mission',
  unassignMission: 'Désassignation mission',
  deleteMission: 'Suppression mission',
};

/**
 * Icônes pour les catégories de tools
 */
function getToolIcon(toolName: string) {
  if (toolName.toLowerCase().includes('intervenant')) {
    return <User className="h-3.5 w-3.5" />;
  }
  if (toolName.toLowerCase().includes('mission')) {
    return <Calendar className="h-3.5 w-3.5" />;
  }
  return <Terminal className="h-3.5 w-3.5" />;
}

/**
 * Couleur selon le type d'outil
 */
function getToolColor(toolName: string): string {
  if (toolName.toLowerCase().includes('intervenant')) {
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
  if (toolName.toLowerCase().includes('mission')) {
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }
  return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
}

/**
 * Formate les données pour l'affichage
 */
function formatData(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Résumé des données retournées
 */
function renderResultSummary(data: unknown): string | null {
  if (Array.isArray(data)) {
    return `${data.length} résultat${data.length > 1 ? 's' : ''}`;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if ('count' in obj) {
      return `${String(obj.count)} élément${Number(obj.count) > 1 ? 's' : ''}`;
    }
    if ('id' in obj) {
      return `ID: ${String(obj.id)}`;
    }
    if ('message' in obj) {
      return String(obj.message);
    }
  }

  return null;
}

/**
 * Composant pour un seul résultat de tool
 */
function ToolResultItem({ result, index }: { result: ToolResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = renderResultSummary(result.data);
  const toolColor = getToolColor(result.tool);
  const formattedData = result.data ? formatData(result.data) : null;

  return (
    <div
      className={cn(
        'group rounded-xl overflow-hidden transition-all duration-300',
        'border bg-[#1e1e2e]/50 backdrop-blur-sm',
        result.success ? 'border-emerald-500/20' : 'border-red-500/20'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3 text-left',
          'hover:bg-white/[0.02] transition-colors'
        )}
      >
        {/* Icône */}
        <div className={cn('p-1.5 rounded-lg', toolColor)}>
          {getToolIcon(result.tool)}
        </div>

        {/* Nom */}
        <span className="flex-1 text-xs font-medium text-zinc-300">
          {TOOL_LABELS[result.tool] || result.tool}
        </span>

        {/* Statut */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium',
            result.success
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          {result.success ? (
            <>
              <Check className="h-3 w-3" />
              <span>Succès</span>
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              <span>Erreur</span>
            </>
          )}
        </div>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {/* Contenu détaillé */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-white/5 animate-fade-in">
          {!result.success && result.error && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{result.error}</p>
            </div>
          )}

          {result.success && summary && (
            <p className="mt-3 text-xs text-zinc-500">{summary}</p>
          )}

          {result.success && formattedData && (
            <pre className="mt-2 p-2 rounded-lg bg-black/30 text-[10px] text-zinc-400 overflow-x-auto">
              {formattedData}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Affiche les résultats des tools exécutés
 */
export function ToolResultDisplay({ results }: ToolResultDisplayProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-2 mt-3 animate-fade-in">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-2">
        Actions exécutées
      </p>
      {results.map((result, index) => (
        <ToolResultItem key={index} result={result} index={index} />
      ))}
    </div>
  );
}

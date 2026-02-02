import { Check, X, User, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    return <User className="h-3 w-3" />;
  }
  if (toolName.toLowerCase().includes('mission')) {
    return <Calendar className="h-3 w-3" />;
  }
  return null;
}

/**
 * Composant pour un seul résultat de tool
 */
function ToolResultItem({ result }: { result: ToolResult }) {
  const summary = renderResultSummary(result.data);

  return (
    <Card className="p-2 text-xs bg-muted/50">
      <div className="flex items-center gap-2">
        {getToolIcon(result.tool)}
        <span className="font-medium">
          {TOOL_LABELS[result.tool] || result.tool}
        </span>
        {result.success ? (
          <Check className="h-3 w-3 text-green-600 ml-auto" />
        ) : (
          <X className="h-3 w-3 text-red-500 ml-auto" />
        )}
      </div>

      {!result.success && result.error && (
        <p className="text-red-500 mt-1 text-xs">{result.error}</p>
      )}

      {result.success && summary && (
        <div className="mt-1 text-muted-foreground text-xs">{summary}</div>
      )}
    </Card>
  );
}

/**
 * Affiche les résultats des tools exécutés
 */
export function ToolResultDisplay({ results }: ToolResultDisplayProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-1 mt-2">
      {results.map((result, index) => (
        <ToolResultItem key={index} result={result} />
      ))}
    </div>
  );
}

/**
 * Résumé des données retournées
 */
function renderResultSummary(data: unknown): string | null {
  if (Array.isArray(data)) {
    return `${data.length} résultat(s)`;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if ('count' in obj) {
      return `${String(obj.count)} élément(s)`;
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

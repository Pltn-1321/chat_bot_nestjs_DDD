import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FloatingChatButton, ChatPanel } from '@/components/chat';

// Créer le client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Contenu principal de l'application */}
        <main className="container mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4">
            Gestion des Intervenants & Missions
          </h1>
          <p className="text-muted-foreground mb-8">
            Utilisez le chatbot en bas à droite pour gérer les intervenants et
            les missions.
          </p>

          {/* Exemples d'utilisation */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💬 Essayez ces commandes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• "Liste les intervenants"</li>
                <li>• "Crée un intervenant Jean Dupont, email jean@test.com, spécialité React"</li>
                <li>• "Quelles sont les missions à venir ?"</li>
                <li>• "Crée une mission Formation NestJS demain à 9h"</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">👤 Gestion Intervenants</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Créer, modifier, supprimer</li>
                <li>• Rechercher par nom/email/spécialité</li>
                <li>• Voir les détails</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📅 Gestion Missions</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Créer, modifier, supprimer</li>
                <li>• Assigner/retirer un intervenant</li>
                <li>• Voir missions à venir/non assignées</li>
              </ul>
            </div>
          </div>
        </main>

        {/* Widget Chat flottant */}
        <FloatingChatButton />
        <ChatPanel />
      </div>
    </QueryClientProvider>
  );
}

export default App;

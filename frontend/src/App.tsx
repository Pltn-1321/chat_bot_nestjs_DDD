import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { ChatPanel } from '@/components/chat';
import { cn } from '@/lib/utils';

// Créer le client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const DEFAULT_CHAT_WIDTH = 450;
const MIN_CHAT_WIDTH = 350;
const MAX_CHAT_WIDTH = 800;

/**
 * Page d'accueil avec Split View
 * Layout moderne avec chat intégré
 */
function MainContent() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              Gestion des Intervenants & Missions
            </h1>
            <p className="text-sm text-zinc-500">
              Plateforme de gestion avec assistance IA intégrée
            </p>
          </div>
        </div>
      </header>

      {/* Cartes de fonctionnalités */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Carte Chat */}
        <div
          className={cn(
            'group p-6 rounded-2xl border border-violet-500/20',
            'bg-gradient-to-br from-violet-500/10 to-violet-900/5',
            'hover:border-violet-500/40 transition-all duration-300'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="font-semibold text-zinc-100 mb-2">
            Assistant IA Intégré
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Utilisez le panneau de droite pour interagir avec l'assistant.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs">
              GPT-4
            </span>
            <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs">
              Tools
            </span>
          </div>
        </div>

        {/* Carte Intervenants */}
        <div
          className={cn(
            'group p-6 rounded-2xl border border-blue-500/20',
            'bg-gradient-to-br from-blue-500/10 to-blue-900/5',
            'hover:border-blue-500/40 transition-all duration-300'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-semibold text-zinc-100 mb-2">
            Gestion Intervenants
          </h3>
          <ul className="text-sm text-zinc-500 space-y-1.5">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-blue-500" />
              Créer, modifier, supprimer
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-blue-500" />
              Rechercher par nom/email
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-blue-500" />
              Voir les détails
            </li>
          </ul>
        </div>

        {/* Carte Missions */}
        <div
          className={cn(
            'group p-6 rounded-2xl border border-amber-500/20',
            'bg-gradient-to-br from-amber-500/10 to-amber-900/5',
            'hover:border-amber-500/40 transition-all duration-300'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="font-semibold text-zinc-100 mb-2">
            Gestion Missions
          </h3>
          <ul className="text-sm text-zinc-500 space-y-1.5">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-amber-500" />
              Créer, modifier, supprimer
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-amber-500" />
              Assigner des intervenants
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-amber-500" />
              Voir missions à venir
            </li>
          </ul>
        </div>
      </div>

      {/* Section exemples de commandes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          Exemples de commandes
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              cmd: 'Liste les intervenants',
              desc: 'Affiche tous les intervenants enregistrés',
            },
            {
              cmd: 'Crée un intervenant Jean Dupont, email jean@test.com',
              desc: 'Crée un nouvel intervenant avec les informations fournies',
            },
            {
              cmd: 'Quelles sont les missions à venir ?',
              desc: 'Liste les missions programmées dans le futur',
            },
            {
              cmd: 'Assigne la mission #123 à Jean Dupont',
              desc: 'Assigne un intervenant à une mission spécifique',
            },
          ].map((example, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-xl border border-zinc-800',
                'bg-zinc-900/50 hover:bg-zinc-900',
                'transition-all duration-200 group'
              )}
            >
              <code className="text-sm text-violet-400 font-mono">
                "{example.cmd}"
              </code>
              <p className="text-xs text-zinc-600 mt-2 group-hover:text-zinc-500 transition-colors">
                {example.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Layout principal avec Split View
 */
function App() {
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const handleResize = (delta: number) => {
    const newWidth = chatWidth + delta;
    if (newWidth >= MIN_CHAT_WIDTH && newWidth <= MAX_CHAT_WIDTH) {
      setChatWidth(newWidth);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex overflow-hidden bg-[#0a0a0f]">
        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <MainContent />
        </main>

        {/* Split View - Panneau de chat */}
        <ChatPanel
          width={chatWidth}
          onResize={handleResize}
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;

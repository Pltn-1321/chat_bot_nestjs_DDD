import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TOOL_DEFINITIONS } from './tool-definitions';

/**
 * Format d'un message de chat pour l'API
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string | null;
  tool_calls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * Service d'intégration avec OpenRouter (compatible API OpenAI)
 *
 * OpenRouter permet d'accéder à différents modèles LLM via une API unifiée.
 * Le format est identique à l'API OpenAI, ce qui permet d'utiliser le SDK officiel.
 */
@Injectable()
export class OpenRouterService {
  private client: OpenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    // Configuration du client OpenAI pointant vers OpenRouter
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.getOrThrow<string>('OPENROUTER_API_KEY'),
      defaultHeaders: {
        // Headers recommandés par OpenRouter pour le tracking
        'HTTP-Referer': this.configService.get(
          'APP_URL',
          'http://localhost:3000',
        ),
        'X-Title': 'Gestion Intervenants - Chatbot',
      },
    });

    // Modèle à utiliser (configuré dans .env)
    this.model = this.configService.get(
      'OPENROUTER_MODEL',
      'z-ai/glm-4.5-air:free',
    );
  }

  /**
   * Envoie une requête de chat avec support des tools
   * Retourne la réponse complète (non-streaming)
   */
  async chat(messages: ChatMessage[]): Promise<OpenAI.Chat.ChatCompletion> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: this.getSystemPrompt(),
    };

    // Convertir nos messages au format OpenAI
    const openAIMessages: ChatCompletionMessageParam[] = [
      systemMessage,
      ...messages,
    ].map((msg) => this.toOpenAIMessage(msg));

    return this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto', // Le modèle décide quand utiliser les tools
    });
  }

  /**
   * Convertit notre format de message vers le format OpenAI
   */
  private toOpenAIMessage(msg: ChatMessage): ChatCompletionMessageParam {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: msg.content || '',
        tool_call_id: msg.tool_call_id || '',
      };
    }

    if (msg.role === 'assistant' && msg.tool_calls) {
      return {
        role: 'assistant',
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      };
    }

    if (msg.role === 'user') {
      return {
        role: 'user',
        content: msg.content || '',
      };
    }

    if (msg.role === 'system') {
      return {
        role: 'system',
        content: msg.content || '',
      };
    }

    return {
      role: 'assistant',
      content: msg.content || '',
    };
  }

  /**
   * Prompt système qui définit le comportement du chatbot
   */
  private getSystemPrompt(): string {
    return `Tu es un assistant intelligent pour la gestion des intervenants et des missions d'enseignement.

CAPACITÉS:
- Créer, modifier, rechercher et supprimer des intervenants (enseignants/formateurs)
- Créer, modifier, rechercher et supprimer des missions (cours/formations)
- Assigner ou retirer des intervenants des missions
- Consulter les missions à venir ou non assignées
- Voir le planning d'un intervenant

RÈGLES:
1. Utilise TOUJOURS les outils disponibles pour effectuer les actions demandées
2. Réponds TOUJOURS en français
3. Sois concis mais informatif dans tes réponses
4. Après avoir effectué une action, confirme ce qui a été fait avec les détails pertinents
5. Si une erreur se produit, explique clairement le problème à l'utilisateur
6. Si tu as besoin de plus d'informations pour exécuter une action, demande poliment

EXEMPLES D'INTERACTIONS:
- "Crée un intervenant Jean Dupont" → Demander l'email et la spécialité si manquants
- "Liste les intervenants" → Utiliser getIntervenants
- "Assigne Marie à la formation React" → Chercher l'intervenant et la mission, puis assigner

FORMAT DES DATES:
- Quand l'utilisateur dit "demain", "lundi prochain", etc., convertis en date ISO 8601
- La date actuelle est ${new Date().toISOString().split('T')[0]}`;
  }
}

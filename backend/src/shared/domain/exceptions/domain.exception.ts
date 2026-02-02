/**
 * DomainException - Classe de base pour toutes les exceptions du Domain
 *
 * Ces exceptions sont PURES et ne dépendent d'aucun framework.
 * Elles seront traduites en exceptions HTTP par la couche Presentation.
 *
 * Hiérarchie des exceptions:
 *   DomainException
 *   ├── EntityNotFoundException
 *   ├── BusinessRuleViolationException
 *   └── ValidationException
 */
export abstract class DomainException extends Error {
  /**
   * Code unique identifiant le type d'erreur
   * Utile pour l'internationalisation et le debugging
   */
  public readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || this.constructor.name;

    // Maintient la stack trace correcte en V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

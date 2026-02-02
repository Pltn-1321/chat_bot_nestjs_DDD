import { ValueObject } from '../../../../shared/domain';

/**
 * Email - Value Object représentant une adresse email valide
 *
 * Responsabilités:
 * - Valider le format de l'email à la création
 * - Normaliser l'email (minuscules)
 * - Garantir qu'un email invalide ne peut JAMAIS exister dans le système
 *
 * Le constructeur est PRIVÉ - on passe obligatoirement par create()
 * qui effectue la validation.
 */

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  // Regex simple pour validation email
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Constructeur privé - force l'utilisation de create()
   */
  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Factory method - seul moyen de créer un Email
   *
   * @param email - L'adresse email brute
   * @throws Error si l'email est invalide
   * @returns Une instance Email validée et normalisée
   */
  static create(email: string): Email {
    // Validation: non vide
    if (!email || email.trim().length === 0) {
      throw new Error("L'email ne peut pas être vide");
    }

    // Normalisation: suppression des espaces et mise en minuscules
    const normalizedEmail = email.trim().toLowerCase();

    // Validation: format email
    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error(`Format d'email invalide: ${email}`);
    }

    return new Email({ value: normalizedEmail });
  }

  /**
   * Getter pour accéder à la valeur
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Représentation string pour l'affichage/debug
   */
  toString(): string {
    return this.value;
  }
}

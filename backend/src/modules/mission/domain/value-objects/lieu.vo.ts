import { ValueObject } from '../../../../shared/domain';

/**
 * Lieu - Value Object représentant le lieu d'une mission
 *
 * Règles métier:
 * 1. Le lieu ne peut pas être vide
 * 2. Le lieu doit avoir au moins 2 caractères
 * 3. Le lieu est normalisé (trim)
 *
 * Exemple:
 *   const lieu = Lieu.create("  Paris  ");
 *   console.log(lieu.value); // "Paris"
 */

interface LieuProps {
  value: string;
}

export class Lieu extends ValueObject<LieuProps> {
  private static readonly MIN_LENGTH = 2;

  private constructor(props: LieuProps) {
    super(props);
  }

  /**
   * Factory method - seul moyen de créer un Lieu
   */
  static create(lieu: string): Lieu {
    if (!lieu || lieu.trim().length === 0) {
      throw new Error('Le lieu ne peut pas être vide');
    }

    const normalized = lieu.trim();

    if (normalized.length < this.MIN_LENGTH) {
      throw new Error(
        `Le lieu doit avoir au moins ${this.MIN_LENGTH} caractères`,
      );
    }

    return new Lieu({ value: normalized });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }
}

import { ValueObject } from '../../../../shared/domain';

/**
 * Specialite - Value Object représentant la spécialité d'un intervenant
 *
 * Règles métier:
 * 1. La spécialité ne peut pas être vide
 * 2. La spécialité doit avoir au moins 2 caractères
 * 3. La spécialité est normalisée (première lettre majuscule)
 *
 * Exemple:
 *   const spec = Specialite.create("javascript");
 *   console.log(spec.value); // "Javascript"
 */

interface SpecialiteProps {
  value: string;
}

export class Specialite extends ValueObject<SpecialiteProps> {
  private static readonly MIN_LENGTH = 2;

  private constructor(props: SpecialiteProps) {
    super(props);
  }

  /**
   * Factory method - seul moyen de créer une Specialite
   *
   * @param specialite - La spécialité brute
   * @throws Error si invalide
   */
  static create(specialite: string): Specialite {
    // Validation: non vide
    if (!specialite || specialite.trim().length === 0) {
      throw new Error('La spécialité ne peut pas être vide');
    }

    // Normalisation: suppression des espaces
    const normalized = specialite.trim();

    // Validation: longueur minimum
    if (normalized.length < this.MIN_LENGTH) {
      throw new Error(
        `La spécialité doit avoir au moins ${this.MIN_LENGTH} caractères`,
      );
    }

    // Capitalisation: première lettre majuscule, reste en minuscules
    const capitalized =
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();

    return new Specialite({ value: capitalized });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }
}

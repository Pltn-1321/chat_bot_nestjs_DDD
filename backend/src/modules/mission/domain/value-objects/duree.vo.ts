import { ValueObject } from '../../../../shared/domain';

/**
 * Duree - Value Object représentant la durée d'une mission en minutes
 *
 * Règles métier:
 * 1. La durée doit être positive (> 0)
 * 2. La durée est exprimée en minutes
 * 3. Maximum raisonnable : 480 minutes (8 heures)
 *
 * Exemple:
 *   const duree = Duree.create(120);
 *   console.log(duree.value);    // 120
 *   console.log(duree.toHours()); // 2
 */

interface DureeProps {
  value: number; // en minutes
}

export class Duree extends ValueObject<DureeProps> {
  private static readonly MIN_MINUTES = 15; // Minimum 15 minutes
  private static readonly MAX_MINUTES = 480; // Maximum 8 heures

  private constructor(props: DureeProps) {
    super(props);
  }

  /**
   * Factory method - seul moyen de créer une Duree
   *
   * @param minutes - Durée en minutes
   */
  static create(minutes: number): Duree {
    if (!Number.isInteger(minutes)) {
      throw new Error('La durée doit être un nombre entier de minutes');
    }

    if (minutes < this.MIN_MINUTES) {
      throw new Error(
        `La durée minimum est de ${this.MIN_MINUTES} minutes`,
      );
    }

    if (minutes > this.MAX_MINUTES) {
      throw new Error(
        `La durée maximum est de ${this.MAX_MINUTES} minutes (${this.MAX_MINUTES / 60}h)`,
      );
    }

    return new Duree({ value: minutes });
  }

  /**
   * Crée une durée à partir d'heures
   */
  static fromHours(hours: number): Duree {
    return this.create(Math.round(hours * 60));
  }

  get value(): number {
    return this.props.value;
  }

  /**
   * Retourne la durée en heures (nombre décimal)
   */
  toHours(): number {
    return this.props.value / 60;
  }

  /**
   * Format lisible : "2h30" ou "45min"
   */
  toString(): string {
    const hours = Math.floor(this.props.value / 60);
    const minutes = this.props.value % 60;

    if (hours === 0) {
      return `${minutes}min`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
}

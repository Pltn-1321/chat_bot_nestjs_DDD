/**
 * ValueObject - Classe de base pour tous les Value Objects
 *
 * Un Value Object est défini UNIQUEMENT par ses attributs, pas par une identité.
 * Deux Value Objects avec les mêmes valeurs sont considérés égaux.
 *
 * Caractéristiques:
 * - Immutable (ne peut pas être modifié après création)
 * - Égalité par valeur (pas par référence)
 * - Validation à la création
 *
 * @example
 * class Email extends ValueObject<{ value: string }> {
 *   static create(email: string): Email {
 *     if (!email.includes('@')) throw new Error('Email invalide');
 *     return new Email({ value: email.toLowerCase() });
 *   }
 *
 *   get value(): string {
 *     return this.props.value;
 *   }
 * }
 */
export abstract class ValueObject<T extends object> {
  protected readonly props: T;

  protected constructor(props: T) {
    // Object.freeze rend l'objet immutable
    this.props = Object.freeze(props);
  }

  /**
   * Compare deux Value Objects par leurs valeurs
   * Retourne true si toutes les propriétés sont identiques
   */
  equals(other: ValueObject<T> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    // Vérifie que c'est le même type de Value Object
    if (other.constructor.name !== this.constructor.name) {
      return false;
    }

    // Compare les propriétés une par une
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

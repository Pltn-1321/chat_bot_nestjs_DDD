import { DomainEvent } from './domain-event.base';

/**
 * Entity - Classe de base pour toutes les entités du domaine
 *
 * Une Entity a une IDENTITÉ qui persiste dans le temps.
 * Deux entités sont égales si leurs IDs sont identiques,
 * même si leurs autres propriétés diffèrent.
 *
 * Caractéristiques:
 * - Identité unique (ID)
 * - Peut émettre des Domain Events
 * - Contient de la logique métier (pas un simple conteneur de données)
 * - Égalité par identité (pas par valeur)
 *
 * @example
 * class Intervenant extends Entity<number> {
 *   private constructor(
 *     id: number,
 *     private _nom: string,
 *     private _email: Email,
 *   ) {
 *     super(id);
 *   }
 *
 *   static create(props: CreateIntervenantProps): Intervenant {
 *     const intervenant = new Intervenant(0, props.nom, props.email);
 *     intervenant.addDomainEvent(new IntervenantCreatedEvent(...));
 *     return intervenant;
 *   }
 * }
 */
export abstract class Entity<TId> {
  /** Identifiant unique de l'entité */
  protected readonly _id: TId;

  /** Liste des événements émis par cette entité (en attente de publication) */
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this._id = id;
  }

  /** Getter pour l'ID */
  get id(): TId {
    return this._id;
  }

  /**
   * Compare deux entités par leur identité (ID)
   */
  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    // Vérifie que c'est le même type d'entité
    if (other.constructor.name !== this.constructor.name) {
      return false;
    }

    // Compare les IDs
    return this._id === other._id;
  }

  /**
   * Récupère tous les événements en attente de publication
   */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * Ajoute un événement à la liste des événements en attente
   * Ces événements seront publiés après la persistance de l'entité
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Vide la liste des événements (appelé après publication)
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

import { Entity } from '../../../../shared/domain';
import { Email, Specialite } from '../value-objects';
import {
  IntervenantCreatedEvent,
  IntervenantUpdatedEvent,
  IntervenantDeletedEvent,
} from '../events';

/**
 * Props pour créer un nouvel Intervenant
 */
export interface CreateIntervenantProps {
  nom: string;
  email: string;
  telephone?: string;
  specialite: string;
}

/**
 * Props pour reconstruire un Intervenant depuis la BDD
 */
export interface ReconstructIntervenantProps {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  specialite: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Intervenant - Entity représentant une personne qui réalise des missions
 *
 * Cette classe contient:
 * - La logique métier (validation, règles)
 * - Les Value Objects pour les champs avec contraintes
 * - L'émission des Domain Events
 *
 * Le constructeur est PRIVÉ - on utilise:
 * - create() pour créer un nouvel intervenant
 * - reconstruct() pour reconstruire depuis la BDD
 */
export class Intervenant extends Entity<number> {
  private _nom: string;
  private _email: Email;
  private _telephone: string | null;
  private _specialite: Specialite;
  private _createdAt: Date;
  private _updatedAt: Date;

  /**
   * Constructeur privé - force l'utilisation des factory methods
   */
  private constructor(
    id: number,
    nom: string,
    email: Email,
    telephone: string | null,
    specialite: Specialite,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._nom = nom;
    this._email = email;
    this._telephone = telephone;
    this._specialite = specialite;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ==========================================
  // FACTORY METHODS
  // ==========================================

  /**
   * Crée un NOUVEL intervenant (pas encore en BDD)
   * ID = 0 car sera assigné par la BDD
   */
  static create(props: CreateIntervenantProps): Intervenant {
    // Validation du nom
    if (!props.nom || props.nom.trim().length < 2) {
      throw new Error('Le nom doit avoir au moins 2 caractères');
    }

    // Création des Value Objects (ils valident eux-mêmes)
    const email = Email.create(props.email);
    const specialite = Specialite.create(props.specialite);

    const now = new Date();

    const intervenant = new Intervenant(
      0, // ID temporaire, sera assigné par la BDD
      props.nom.trim(),
      email,
      props.telephone?.trim() || null,
      specialite,
      now,
      now,
    );

    // Émettre l'événement de création
    intervenant.addDomainEvent(
      new IntervenantCreatedEvent(
        intervenant.id,
        intervenant.nom,
        intervenant.email.value,
        intervenant.specialite.value,
      ),
    );

    return intervenant;
  }

  /**
   * Reconstruit un intervenant depuis les données de la BDD
   * Utilisé par le Repository/Mapper
   * Pas d'événement émis (ce n'est pas une action métier)
   */
  static reconstruct(props: ReconstructIntervenantProps): Intervenant {
    return new Intervenant(
      props.id,
      props.nom,
      Email.create(props.email), // Les VO revalident
      props.telephone,
      Specialite.create(props.specialite),
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================
  // GETTERS (lecture seule)
  // ==========================================

  get nom(): string {
    return this._nom;
  }

  get email(): Email {
    return this._email;
  }

  get telephone(): string | null {
    return this._telephone;
  }

  get specialite(): Specialite {
    return this._specialite;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==========================================
  // MÉTHODES MÉTIER (comportements)
  // ==========================================

  /**
   * Met à jour les informations de l'intervenant
   * Seuls les champs fournis sont modifiés
   */
  update(props: {
    nom?: string;
    email?: string;
    telephone?: string | null;
    specialite?: string;
  }): void {
    const changedFields: string[] = [];

    if (props.nom !== undefined && props.nom !== this._nom) {
      if (props.nom.trim().length < 2) {
        throw new Error('Le nom doit avoir au moins 2 caractères');
      }
      this._nom = props.nom.trim();
      changedFields.push('nom');
    }

    if (props.email !== undefined && props.email !== this._email.value) {
      this._email = Email.create(props.email);
      changedFields.push('email');
    }

    if (props.telephone !== undefined && props.telephone !== this._telephone) {
      this._telephone = props.telephone?.trim() || null;
      changedFields.push('telephone');
    }

    if (
      props.specialite !== undefined &&
      props.specialite !== this._specialite.value
    ) {
      this._specialite = Specialite.create(props.specialite);
      changedFields.push('specialite');
    }

    // Si quelque chose a changé, émettre un événement
    if (changedFields.length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(
        new IntervenantUpdatedEvent(this.id, changedFields),
      );
    }
  }

  /**
   * Marque l'intervenant comme supprimé
   * Émet un événement pour notifier les autres systèmes
   */
  markAsDeleted(): void {
    this.addDomainEvent(
      new IntervenantDeletedEvent(this.id, this._email.value),
    );
  }
}

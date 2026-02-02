import { Entity } from '../../../../shared/domain';
import { Lieu, Duree } from '../value-objects';
import {
  MissionCreatedEvent,
  MissionUpdatedEvent,
  MissionDeletedEvent,
  MissionAssignedEvent,
  MissionUnassignedEvent,
} from '../events';

/**
 * Props pour créer une nouvelle Mission
 */
export interface CreateMissionProps {
  titre: string;
  date: Date;
  duree: number; // en minutes
  lieu: string;
  intervenantId?: number; // optionnel à la création
}

/**
 * Props pour reconstruire une Mission depuis la BDD
 */
export interface ReconstructMissionProps {
  id: number;
  titre: string;
  date: Date;
  duree: number;
  lieu: string;
  intervenantId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mission - Entity représentant une intervention/cours à réaliser
 *
 * Règles métier:
 * - Une mission peut être créée sans intervenant (à assigner plus tard)
 * - Un intervenant ne peut être assigné qu'à une mission à la fois (à vérifier au niveau Application)
 * - La date de mission doit être dans le futur (pour création)
 *
 * Relations:
 * - Une Mission référence un Intervenant par son ID (pas l'entité complète)
 * - C'est un AGGREGATE ROOT indépendant
 */
export class Mission extends Entity<number> {
  private _titre: string;
  private _date: Date;
  private _duree: Duree;
  private _lieu: Lieu;
  private _intervenantId: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: number,
    titre: string,
    date: Date,
    duree: Duree,
    lieu: Lieu,
    intervenantId: number | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._titre = titre;
    this._date = date;
    this._duree = duree;
    this._lieu = lieu;
    this._intervenantId = intervenantId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ==========================================
  // FACTORY METHODS
  // ==========================================

  /**
   * Crée une nouvelle mission
   */
  static create(props: CreateMissionProps): Mission {
    // Validation du titre
    if (!props.titre || props.titre.trim().length < 3) {
      throw new Error('Le titre doit avoir au moins 3 caractères');
    }

    // Validation de la date (doit être dans le futur)
    const now = new Date();
    if (props.date <= now) {
      throw new Error('La date de mission doit être dans le futur');
    }

    // Création des Value Objects
    const duree = Duree.create(props.duree);
    const lieu = Lieu.create(props.lieu);

    const mission = new Mission(
      0, // ID temporaire
      props.titre.trim(),
      props.date,
      duree,
      lieu,
      props.intervenantId ?? null,
      now,
      now,
    );

    // Événement de création
    mission.addDomainEvent(
      new MissionCreatedEvent(
        mission.id,
        mission.titre,
        mission.date,
        mission.duree.value,
        mission.lieu.value,
      ),
    );

    // Si un intervenant est assigné dès la création
    if (props.intervenantId) {
      mission.addDomainEvent(
        new MissionAssignedEvent(
          mission.id,
          mission.titre,
          props.intervenantId,
          mission.date,
        ),
      );
    }

    return mission;
  }

  /**
   * Reconstruit une mission depuis la BDD
   */
  static reconstruct(props: ReconstructMissionProps): Mission {
    return new Mission(
      props.id,
      props.titre,
      props.date,
      Duree.create(props.duree),
      Lieu.create(props.lieu),
      props.intervenantId,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================
  // GETTERS
  // ==========================================

  get titre(): string {
    return this._titre;
  }

  get date(): Date {
    return this._date;
  }

  get duree(): Duree {
    return this._duree;
  }

  get lieu(): Lieu {
    return this._lieu;
  }

  get intervenantId(): number | null {
    return this._intervenantId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Indique si la mission a un intervenant assigné
   */
  get isAssigned(): boolean {
    return this._intervenantId !== null;
  }

  // ==========================================
  // MÉTHODES MÉTIER
  // ==========================================

  /**
   * Met à jour les informations de la mission
   */
  update(props: {
    titre?: string;
    date?: Date;
    duree?: number;
    lieu?: string;
  }): void {
    const changedFields: string[] = [];

    if (props.titre !== undefined && props.titre !== this._titre) {
      if (props.titre.trim().length < 3) {
        throw new Error('Le titre doit avoir au moins 3 caractères');
      }
      this._titre = props.titre.trim();
      changedFields.push('titre');
    }

    if (props.date !== undefined && props.date.getTime() !== this._date.getTime()) {
      // Pour une mise à jour, on permet les dates passées (mission déjà planifiée)
      this._date = props.date;
      changedFields.push('date');
    }

    if (props.duree !== undefined && props.duree !== this._duree.value) {
      this._duree = Duree.create(props.duree);
      changedFields.push('duree');
    }

    if (props.lieu !== undefined && props.lieu !== this._lieu.value) {
      this._lieu = Lieu.create(props.lieu);
      changedFields.push('lieu');
    }

    if (changedFields.length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(new MissionUpdatedEvent(this.id, changedFields));
    }
  }

  /**
   * Assigne un intervenant à cette mission
   *
   * @param intervenantId - ID de l'intervenant à assigner
   * @throws Error si un intervenant est déjà assigné
   */
  assignIntervenant(intervenantId: number): void {
    if (this._intervenantId !== null) {
      throw new Error(
        `Cette mission est déjà assignée à l'intervenant ${this._intervenantId}. ` +
        `Désassignez-le d'abord avec unassignIntervenant().`
      );
    }

    this._intervenantId = intervenantId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MissionAssignedEvent(
        this.id,
        this._titre,
        intervenantId,
        this._date,
      ),
    );
  }

  /**
   * Retire l'intervenant de cette mission
   */
  unassignIntervenant(): void {
    if (this._intervenantId === null) {
      throw new Error('Aucun intervenant assigné à cette mission');
    }

    const previousIntervenantId = this._intervenantId;
    this._intervenantId = null;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MissionUnassignedEvent(this.id, previousIntervenantId),
    );
  }

  /**
   * Réassigne la mission à un autre intervenant
   * (raccourci pour unassign + assign)
   */
  reassignIntervenant(newIntervenantId: number): void {
    if (this._intervenantId === newIntervenantId) {
      return; // Déjà assigné à cet intervenant
    }

    if (this._intervenantId !== null) {
      this.unassignIntervenant();
    }

    this.assignIntervenant(newIntervenantId);
  }

  /**
   * Marque la mission comme supprimée
   */
  markAsDeleted(): void {
    // Si un intervenant était assigné, émettre l'événement de désassignation
    if (this._intervenantId !== null) {
      this.addDomainEvent(
        new MissionUnassignedEvent(this.id, this._intervenantId),
      );
    }

    this.addDomainEvent(
      new MissionDeletedEvent(this.id, this._titre),
    );
  }
}

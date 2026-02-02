import { DomainEvent } from '../../../../shared/domain';

/**
 * Événement émis lorsqu'un intervenant est assigné à une mission
 *
 * C'est un événement CROSS-MODULE important :
 * - Le module Intervenant peut écouter cet événement
 * - Pour mettre à jour des statistiques
 * - Pour envoyer une notification à l'intervenant
 * - Pour vérifier les conflits de planning
 */
export class MissionAssignedEvent extends DomainEvent {
  constructor(
    public readonly missionId: number,
    public readonly missionTitre: string,
    public readonly intervenantId: number,
    public readonly missionDate: Date,
  ) {
    super();
  }
}

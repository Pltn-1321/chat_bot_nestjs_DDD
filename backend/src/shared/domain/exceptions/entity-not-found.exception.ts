import { DomainException } from './domain.exception';

/**
 * EntityNotFoundException - Levée quand une entité n'est pas trouvée
 *
 * Sera traduite en HTTP 404 par le DomainExceptionFilter
 *
 * @example
 * throw new EntityNotFoundException('Intervenant', 123);
 * // Message: "Intervenant with id 123 not found"
 */
export class EntityNotFoundException extends DomainException {
  public readonly entityName: string;
  public readonly entityId: string | number;

  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id ${id} not found`, 'ENTITY_NOT_FOUND');
    this.entityName = entityName;
    this.entityId = id;
  }
}

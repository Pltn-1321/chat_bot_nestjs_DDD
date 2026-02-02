// Classes de base pour le Domain-Driven Design
export { Entity } from './entity.base';
export { ValueObject } from './value-object.base';
export { DomainEvent } from './domain-event.base';

// Ports (interfaces pour l'infrastructure)
export * from './ports';

// Exceptions Domain (pures, sans framework)
export * from './exceptions';

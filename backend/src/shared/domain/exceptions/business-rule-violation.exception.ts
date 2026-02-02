import { DomainException } from './domain.exception';

/**
 * BusinessRuleViolationException - Levée quand une règle métier est violée
 *
 * Sera traduite en HTTP 409 (Conflict) ou 422 (Unprocessable Entity)
 * par le DomainExceptionFilter
 *
 * @example
 * throw new BusinessRuleViolationException('Email already exists', 'EMAIL_ALREADY_EXISTS');
 * throw new BusinessRuleViolationException('Mission has scheduling conflict', 'MISSION_CONFLICT');
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, code?: string) {
    super(message, code || 'BUSINESS_RULE_VIOLATION');
  }
}

import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * AssignMissionDto - Données pour assigner un intervenant à une mission
 */
export class AssignMissionDto {
  @ApiProperty({
    description: 'ID de l\'intervenant à assigner',
    example: 1,
  })
  @IsInt({ message: "L'ID de l'intervenant doit être un nombre entier" })
  intervenantId: number;
}

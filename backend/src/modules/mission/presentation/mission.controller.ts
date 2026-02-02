import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MissionService } from '../application';
import {
  CreateMissionDto,
  UpdateMissionDto,
  AssignMissionDto,
  MissionResponseDto,
} from '../application/dtos';

/**
 * MissionController - API REST pour les missions
 */
@ApiTags('missions')
@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une mission' })
  @ApiResponse({ status: 201, description: 'Mission créée', type: MissionResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() dto: CreateMissionDto): Promise<MissionResponseDto> {
    return this.missionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les missions' })
  @ApiResponse({ status: 200, description: 'Liste des missions', type: [MissionResponseDto] })
  async findAll(): Promise<MissionResponseDto[]> {
    return this.missionService.findAll();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lister les missions à venir' })
  @ApiResponse({ status: 200, description: 'Missions futures', type: [MissionResponseDto] })
  async findUpcoming(): Promise<MissionResponseDto[]> {
    return this.missionService.findUpcoming();
  }

  @Get('unassigned')
  @ApiOperation({ summary: 'Lister les missions non assignées' })
  @ApiResponse({ status: 200, description: 'Missions sans intervenant', type: [MissionResponseDto] })
  async findUnassigned(): Promise<MissionResponseDto[]> {
    return this.missionService.findUnassigned();
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des missions' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche (titre, lieu)', required: false })
  @ApiResponse({ status: 200, description: 'Résultats de recherche', type: [MissionResponseDto] })
  async search(@Query('q') query: string): Promise<MissionResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return this.missionService.findAll();
    }
    return this.missionService.search(query);
  }

  @Get('intervenant/:intervenantId')
  @ApiOperation({ summary: 'Lister les missions d\'un intervenant' })
  @ApiParam({ name: 'intervenantId', description: 'ID de l\'intervenant', type: Number })
  @ApiResponse({ status: 200, description: 'Missions de l\'intervenant', type: [MissionResponseDto] })
  async findByIntervenant(
    @Param('intervenantId', ParseIntPipe) intervenantId: number,
  ): Promise<MissionResponseDto[]> {
    return this.missionService.findByIntervenant(intervenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une mission par ID' })
  @ApiParam({ name: 'id', description: 'ID de la mission', type: Number })
  @ApiResponse({ status: 200, description: 'Mission trouvée', type: MissionResponseDto })
  @ApiResponse({ status: 404, description: 'Mission non trouvée' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MissionResponseDto> {
    return this.missionService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une mission' })
  @ApiParam({ name: 'id', description: 'ID de la mission', type: Number })
  @ApiResponse({ status: 200, description: 'Mission mise à jour', type: MissionResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Mission non trouvée' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMissionDto,
  ): Promise<MissionResponseDto> {
    return this.missionService.update(id, dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assigner un intervenant à une mission' })
  @ApiParam({ name: 'id', description: 'ID de la mission', type: Number })
  @ApiResponse({ status: 200, description: 'Mission assignée', type: MissionResponseDto })
  @ApiResponse({ status: 404, description: 'Mission ou intervenant non trouvé' })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignMissionDto,
  ): Promise<MissionResponseDto> {
    return this.missionService.assign(id, dto);
  }

  @Post(':id/unassign')
  @ApiOperation({ summary: 'Retirer l\'intervenant d\'une mission' })
  @ApiParam({ name: 'id', description: 'ID de la mission', type: Number })
  @ApiResponse({ status: 200, description: 'Intervenant retiré', type: MissionResponseDto })
  @ApiResponse({ status: 404, description: 'Mission non trouvée' })
  async unassign(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MissionResponseDto> {
    return this.missionService.unassign(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une mission' })
  @ApiParam({ name: 'id', description: 'ID de la mission', type: Number })
  @ApiResponse({ status: 204, description: 'Mission supprimée' })
  @ApiResponse({ status: 404, description: 'Mission non trouvée' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.missionService.delete(id);
  }
}

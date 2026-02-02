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
import { IntervenantService } from '../application';
import {
  CreateIntervenantDto,
  UpdateIntervenantDto,
  IntervenantResponseDto,
} from '../application/dtos';

/**
 * IntervenantController - Couche Presentation
 *
 * Expose l'API REST pour les intervenants.
 */
@ApiTags('intervenants')
@Controller('intervenants')
export class IntervenantController {
  constructor(private readonly intervenantService: IntervenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un intervenant' })
  @ApiResponse({ status: 201, description: 'Intervenant créé', type: IntervenantResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async create(
    @Body() dto: CreateIntervenantDto,
  ): Promise<IntervenantResponseDto> {
    return this.intervenantService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les intervenants' })
  @ApiResponse({ status: 200, description: 'Liste des intervenants', type: [IntervenantResponseDto] })
  async findAll(): Promise<IntervenantResponseDto[]> {
    return this.intervenantService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des intervenants' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche (nom, email, spécialité)', required: false })
  @ApiResponse({ status: 200, description: 'Résultats de recherche', type: [IntervenantResponseDto] })
  async search(@Query('q') query: string): Promise<IntervenantResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return this.intervenantService.findAll();
    }
    return this.intervenantService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un intervenant par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'intervenant', type: Number })
  @ApiResponse({ status: 200, description: 'Intervenant trouvé', type: IntervenantResponseDto })
  @ApiResponse({ status: 404, description: 'Intervenant non trouvé' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IntervenantResponseDto> {
    return this.intervenantService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un intervenant' })
  @ApiParam({ name: 'id', description: 'ID de l\'intervenant', type: Number })
  @ApiResponse({ status: 200, description: 'Intervenant mis à jour', type: IntervenantResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Intervenant non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIntervenantDto,
  ): Promise<IntervenantResponseDto> {
    return this.intervenantService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un intervenant' })
  @ApiParam({ name: 'id', description: 'ID de l\'intervenant', type: Number })
  @ApiResponse({ status: 204, description: 'Intervenant supprimé' })
  @ApiResponse({ status: 404, description: 'Intervenant non trouvé' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.intervenantService.delete(id);
  }
}

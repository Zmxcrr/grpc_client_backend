import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async addFavorite(savedRequestId: string, userId: string): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOne({
      where: { savedRequestId, userId },
    });
    if (existing) throw new ConflictException('Already in favorites');

    const favorite = this.favoritesRepository.create({ savedRequestId, userId });
    const saved = await this.favoritesRepository.save(favorite);
    await this.cacheManager.del(`favorites:${userId}`);
    return saved;
  }

  async removeFavorite(savedRequestId: string, userId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { savedRequestId, userId },
    });
    if (!favorite) throw new NotFoundException('Favorite not found');
    await this.favoritesRepository.remove(favorite);
    await this.cacheManager.del(`favorites:${userId}`);
    return true;
  }

  async findAllByUser(userId: string): Promise<Favorite[]> {
    const cacheKey = `favorites:${userId}`;
    const cached = await this.cacheManager.get<Favorite[]>(cacheKey);
    if (cached) return cached;
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: ['savedRequest'],
      order: { createdAt: 'DESC' },
    });
    await this.cacheManager.set(cacheKey, favorites, 30000);
    return favorites;
  }
}

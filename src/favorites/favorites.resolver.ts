import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { Favorite } from './entities/favorite.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Reflector } from '@nestjs/core';

@Resolver(() => Favorite)
@UseGuards(new JwtAuthGuard(new Reflector()))
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Query(() => [Favorite])
  async favorites(@CurrentUser() user: User): Promise<Favorite[]> {
    return this.favoritesService.findAllByUser(user.id);
  }

  @Mutation(() => Favorite)
  async addFavorite(
    @Args('savedRequestId', { type: () => ID }) savedRequestId: string,
    @CurrentUser() user: User,
  ): Promise<Favorite> {
    return this.favoritesService.addFavorite(savedRequestId, user.id);
  }

  @Mutation(() => Boolean)
  async removeFavorite(
    @Args('savedRequestId', { type: () => ID }) savedRequestId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.favoritesService.removeFavorite(savedRequestId, user.id);
  }
}

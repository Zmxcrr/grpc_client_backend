import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesResolver } from './favorites.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite])],
  providers: [FavoritesService, FavoritesResolver],
  exports: [FavoritesService],
})
export class FavoritesModule {}

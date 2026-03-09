import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { SavedRequest } from '../../saved-requests/entities/saved-request.entity';

@ObjectType()
@Entity('favorites')
@Unique(['userId', 'savedRequestId'])
export class Favorite {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => SavedRequest, { nullable: false, eager: true })
  savedRequest: SavedRequest;

  @Field(() => ID)
  @Column()
  savedRequestId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

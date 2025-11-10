import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TrakerService } from './traker.service';
import { TrakerController } from './traker.controller';
import {
  TrackedValue,
  TrackedValueSchema,
} from './entities/tracked-value.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: TrackedValue.name, schema: TrackedValueSchema }]),
  ],
  controllers: [TrakerController],
  providers: [TrakerService],
})
export class TrakerModule {}

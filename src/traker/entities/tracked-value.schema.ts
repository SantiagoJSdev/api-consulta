// tracked-value.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'; // <-- Importar Schema

export type TrackedValueDocument = HydratedDocument<TrackedValue>;

@Schema({ timestamps: true })
export class TrackedValue { 
  @Prop({ required: true, type: MongooseSchema.Types.Double }) 
  value: number; 
}

export const TrackedValueSchema = SchemaFactory.createForClass(TrackedValue);
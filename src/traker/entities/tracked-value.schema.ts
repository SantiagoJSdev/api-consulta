import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrackedValueDocument = HydratedDocument<TrackedValue>;

@Schema({ timestamps: true })
export class TrackedValue {
  @Prop({ required: true, type: Number })
  value: number; // El tipo de TypeScript también es number
}

export const TrackedValueSchema = SchemaFactory.createForClass(TrackedValue);
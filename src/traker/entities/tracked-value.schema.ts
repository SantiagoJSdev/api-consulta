import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrackedValueDocument = HydratedDocument<TrackedValue>;

@Schema({ timestamps: true })
export class TrackedValue {
  @Prop({ required: true })
  value: string;
}

export const TrackedValueSchema = SchemaFactory.createForClass(TrackedValue);
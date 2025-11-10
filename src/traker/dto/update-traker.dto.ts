import { PartialType } from '@nestjs/mapped-types';
import { CreateTrakerDto } from './create-traker.dto';

export class UpdateTrakerDto extends PartialType(CreateTrakerDto) {}

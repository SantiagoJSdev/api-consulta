import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { TrakerService } from './traker.service';
import { CreateTrakerDto } from './dto/create-traker.dto';
import { UpdateTrakerDto } from './dto/update-traker.dto';

@Controller('traker')
export class TrakerController {
  constructor(private readonly trakerService: TrakerService) {}

  @Post('run-track')
  @HttpCode(HttpStatus.OK)
  async runTracking() {
    await this.trakerService.trackValue();
    return { message: 'Tracking process executed.' };
  }

  @Post()
  create(@Body() createTrakerDto: CreateTrakerDto) {
   // return this.trakerService.create(createTrakerDto);
  }

  @Get()
  findAll() {
    //return this.trakerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
   // return this.trakerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrakerDto: UpdateTrakerDto) {
   // return this.trakerService.update(+id, updateTrakerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
   // return this.trakerService.remove(+id);
  }
}

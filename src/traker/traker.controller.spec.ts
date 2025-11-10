import { Test, TestingModule } from '@nestjs/testing';
import { TrakerController } from './traker.controller';
import { TrakerService } from './traker.service';

describe('TrakerController', () => {
  let controller: TrakerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrakerController],
      providers: [TrakerService],
    }).compile();

    controller = module.get<TrakerController>(TrakerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

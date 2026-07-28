import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getAllTransfers: jest.fn().mockResolvedValue({
              items: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return transfers', async () => {
      const result = await appController.getTransfers(
        1,
        10,
        'createdAt',
        'desc',
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual({
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    });
  });
});

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export const CounterModelName = 'Counter';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(CounterModelName)
    private readonly counterModel: Model<any>,
  ) {}

  async next(key: string): Promise<number> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const counter = await this.counterModel.findOneAndUpdate(
          { _id: key },
          { $inc: { seq: 1 } },
          { new: true, upsert: true },
        );
        return counter.seq as number;
      } catch (error) {
        if (error?.code !== 11000 || attempt === 3) {
          if (attempt === 3) {
            throw new ServiceUnavailableException(
              'Unable to record the transaction. Please try again.',
            );
          }
          throw error;
        }
      }
    }
    throw new ServiceUnavailableException(
      'Unable to record the transaction. Please try again.',
    );
  }
}

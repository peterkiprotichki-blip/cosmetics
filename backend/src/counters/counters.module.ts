import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CounterModelName, CounterSchema } from './counter.schema';
import { CountersService } from './counters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CounterModelName, schema: CounterSchema },
    ]),
  ],
  providers: [CountersService],
  exports: [CountersService],
})
export class CountersModule {}

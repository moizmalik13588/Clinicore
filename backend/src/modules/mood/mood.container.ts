import { MoodRepository } from './mood.repository';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { IMoodRepository } from './mood.interface';

const moodRepository: IMoodRepository = new MoodRepository();
export const moodService = new MoodService(moodRepository);
const moodController = new MoodController(moodService);

export { moodController };
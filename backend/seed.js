import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from './models/Exercise.js';

dotenv.config();

const exercises = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', isDefault: true },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', isDefault: true },
  { name: 'Chest Press Machine', muscleGroup: 'Chest', equipment: 'Machine', youtubeUrl: 'https://www.youtube.com/watch?v=xUm0BiZCWlQ', isDefault: true },
  { name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4', isDefault: true },
  { name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', youtubeUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', isDefault: true },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', isDefault: true },
  { name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo', isDefault: true },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Machine', youtubeUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', isDefault: true },
  { name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', isDefault: true },
  { name: 'Cable Row', muscleGroup: 'Back', equipment: 'Cable', youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74', isDefault: true },

  // Legs
  { name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', youtubeUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', isDefault: true },
  { name: 'Dumbbell Lunges', muscleGroup: 'Legs', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', isDefault: true },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', youtubeUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', isDefault: true },
  { name: 'Bodyweight Squats', muscleGroup: 'Legs', equipment: 'Bodyweight', youtubeUrl: 'https://www.youtube.com/watch?v=C_VtOYc6j5c', isDefault: true },
  { name: 'Cable Kickback', muscleGroup: 'Legs', equipment: 'Cable', youtubeUrl: 'https://youtu.be/SqO-VUEak2M?si=ZEx6slVb7vlWosbm', isDefault: true },

  // Shoulders
  { name: 'Overhead Barbell Press', muscleGroup: 'Shoulders', equipment: 'Barbell', youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', isDefault: true },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', isDefault: true },
  { name: 'Shoulder Press Machine', muscleGroup: 'Shoulders', equipment: 'Machine', youtubeUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog', isDefault: true },
  { name: 'Pike Push-ups', muscleGroup: 'Shoulders', equipment: 'Bodyweight', youtubeUrl: 'https://youtu.be/XckEEwa1BPI?si=wUw2N_aBgr25VJ09', isDefault: true },
  { name: 'Cable Face Pull', muscleGroup: 'Shoulders', equipment: 'Cable', youtubeUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk', isDefault: true },

  // Arms
  { name: 'Barbell Curl', muscleGroup: 'Arms', equipment: 'Barbell', youtubeUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo', isDefault: true },
  { name: 'Dumbbell Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4', isDefault: true },
  { name: 'Tricep Extension Machine', muscleGroup: 'Arms', equipment: 'Machine', youtubeUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', isDefault: true },
  { name: 'Tricep Dips', muscleGroup: 'Arms', equipment: 'Bodyweight', youtubeUrl: 'https://www.youtube.com/watch?v=0326dy_-CzM', isDefault: true },
  { name: 'Cable Tricep Pushdown', muscleGroup: 'Arms', equipment: 'Cable', youtubeUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', isDefault: true },

  // Core
  { name: 'Barbell Rollout', muscleGroup: 'Core', equipment: 'Barbell', youtubeUrl: 'https://youtu.be/3C1TRMJveXo?si=EIvF7wuX4GDYgqsU', isDefault: true },
  { name: 'Weighted Dumbbell Sit-up', muscleGroup: 'Core', equipment: 'Dumbbell', youtubeUrl: 'https://www.youtube.com/watch?v=jDwoBqPH0jk', isDefault: true },
  { name: 'Ab Crunch Machine', muscleGroup: 'Core', equipment: 'Machine', youtubeUrl: 'https://youtu.be/gJdiUDtIr5M?si=hkDvmML57RU3oztp', isDefault: true },
  { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', isDefault: true },
  { name: 'Cable Woodchopper', muscleGroup: 'Core', equipment: 'Cable', youtubeUrl: 'https://youtu.be/iWxTGXIViro?si=V2Chid1ADCxWQhHC', isDefault: true },
];

const seedExercises = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    await Exercise.deleteMany({ isDefault: true });
    console.log('Cleared existing default exercises');

    await Exercise.insertMany(exercises);
    console.log(`Seeded ${exercises.length} exercises successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedExercises();
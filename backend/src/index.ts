import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

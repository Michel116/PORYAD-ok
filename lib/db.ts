
import { Pool } from 'pg';

// This setup assumes the DATABASE_URL environment variable is set.
// You can set this in a .env file in the root of your project.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

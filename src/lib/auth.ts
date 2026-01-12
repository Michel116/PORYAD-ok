import { query } from './db';
import bcrypt from 'bcrypt';

export async function registerUser(username: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, email, passwordHash]
  );
  return rows[0];
}

export async function authenticateUser(email: string, password: string) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  return match ? { id: user.id, username: user.username, email: user.email } : null;
}

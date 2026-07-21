import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name} (set it in buesuite-e2e/.env)`);
  }
  return value;
}

/** Single source of truth for environment configuration — nothing else reads process.env. */
export const env = Object.freeze({
  baseUrl: required('BASE_URL', 'http://localhost:4200'),
  keycloakUrl: required('KEYCLOAK_URL', 'http://localhost:8090'),
  managerEmail: required('MANAGER_EMAIL', 'aarav.brown5843@acme.com'),
  password: required('TEST_USER_PASSWORD', 'Password@123'),
});

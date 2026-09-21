import { getSession } from '@/lib/session';
import { ok } from '@/lib/api-helpers';

export async function POST() {
  const session = await getSession();
  session.destroy();
  return ok();
}
import { isPlatformAdmin } from './adminAuth';
import { getSessionFromRequest } from './session';

/**
 * Admin check for server components. The /admin layout shows the login / forbidden
 * screens, but Next.js can render a page segment without re-running its layout
 * (client navigation fetches only the changed segment), so every admin page and
 * every data read must call this itself and render nothing when it returns null.
 */
export async function getAdminSession() {
  const auth = await getSessionFromRequest();
  return auth && isPlatformAdmin(auth) ? auth : null;
}

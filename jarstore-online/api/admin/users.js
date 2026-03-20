// api/admin/users.js
const { getSupabase, verifyToken, setCors, ok, err, ADMIN_GITHUB_USERNAME } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyToken(req);
  if (!user?.is_admin) return err(res, 'Accesso negato', 403);

  const sb = getSupabase();

  // GET — lista utenti
  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('users')
      .select('id,github_username,email,avatar_url,is_admin,is_banned,ban_reason,is_whitelisted,github_public_repos,github_created_at,created_at')
      .order('created_at', { ascending: false });

    if (error) return err(res, error.message, 500);
    return ok(res, data);
  }

  // PATCH — ban/unban/whitelist/makeadmin/removeadmin
  if (req.method === 'PATCH') {
    const { id, action, reason } = req.body || {};
    if (!id || !action) return err(res, 'id e action obbligatori');
    if (Number(id) === Number(user.id)) return err(res, 'Non puoi modificare te stesso', 400);

    // Recupera l'utente target per proteggere il superadmin
    const { data: target } = await sb.from('users').select('github_username').eq('id', id).single();
    if (target?.github_username === ADMIN_GITHUB_USERNAME) {
      return err(res, 'Non puoi modificare il superadmin', 403);
    }

    // Solo il superadmin può promuovere/degradare admin
    if ((action === 'makeadmin' || action === 'removeadmin') && user.github_username !== ADMIN_GITHUB_USERNAME) {
      return err(res, 'Solo il superadmin può gestire gli admin', 403);
    }

    let update = {};
    switch (action) {
      case 'ban':         update = { is_banned: true,  ban_reason: reason || 'Nessun motivo' }; break;
      case 'unban':       update = { is_banned: false, ban_reason: null }; break;
      case 'whitelist':   update = { is_whitelisted: true };  break;
      case 'unwhitelist': update = { is_whitelisted: false }; break;
      case 'makeadmin':   update = { is_admin: true };  break;
      case 'removeadmin': update = { is_admin: false }; break;
      default: return err(res, 'Azione non valida');
    }

    const { error } = await sb.from('users').update(update).eq('id', id);
    if (error) return err(res, error.message, 500);
    return ok(res, { success: true });
  }

  return err(res, 'Method not allowed', 405);
};

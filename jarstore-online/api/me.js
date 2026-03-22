const { verifyToken, getSupabase, setCors, ok, err } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const tokenUser = verifyToken(req);
  if (!tokenUser) return err(res, 'Non autenticato', 401);

  // Ricarica sempre dal DB per avere lo status aggiornato
  const sb = getSupabase();
  const { data: user, error } = await sb
    .from('users')
    .select('id,github_username,email,avatar_url,user_status,ban_reason')
    .eq('id', tokenUser.id)
    .single();

  if (error || !user) return err(res, 'Utente non trovato', 404);
  if (user.user_status === 'banned') return err(res, 'Account sospeso', 403);

  ok(res, user);
};

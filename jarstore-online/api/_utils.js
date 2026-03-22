const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SUPERADMIN = 'CosmoUniverso';
const BUCKET     = 'jars';
const MAX_USERS  = 40;
const STORAGE_LIMIT_MB = 850; // margine sicuro su 1GB free

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const ok  = (res, data, status = 200) => res.status(status).json(data);
const err = (res, msg,  status = 400) => res.status(status).json({ error: msg });

function isAdmin(status)    { return ['admin','superadmin'].includes(status); }
function canUpload(status)  { return ['active','whitelisted','admin','superadmin'].includes(status); }
function maxProjects(status) {
  if (['admin','superadmin'].includes(status)) return 9999;
  if (status === 'whitelisted') return 5;
  if (status === 'active')      return 2;
  return 0;
}

async function checkStorageLimit(sb) {
  try {
    const { data: programs } = await sb.from('programs').select('file_size').eq('status','approved');
    const totalMB = (programs||[]).reduce((s,p) => s + (p.file_size||0), 0) / 1024 / 1024;
    return totalMB >= STORAGE_LIMIT_MB;
  } catch { return false; }
}

module.exports = {
  getSupabase, verifyToken, signToken, setCors, ok, err,
  SUPERADMIN, BUCKET, MAX_USERS,
  isAdmin, canUpload, maxProjects, checkStorageLimit,
};

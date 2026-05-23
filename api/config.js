// api/config.js — Exposes only PUBLIC config to frontend
// Secret keys never leave the server

export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).json({
    paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    aiModel: process.env.AI_PROVIDER || 'claude',
  });
}

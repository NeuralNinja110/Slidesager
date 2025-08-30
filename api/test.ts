export default function handler(req: any, res: any) {
  return res.status(200).json({
    message: 'Test endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

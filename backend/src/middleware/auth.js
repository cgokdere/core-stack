const jwt = require('jsonwebtoken');

function authenticate(db, config) {
  return (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş.' });
    }
    const user = db
      .prepare('SELECT id, email, name, role, specialty FROM users WHERE id = ?')
      .get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş.' });
    }
    req.user = user;
    next();
  };
}

module.exports = { authenticate };

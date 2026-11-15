// Access control for everything below /api/children/:childId.
//
// The caller's relation to the child decides what they may do:
//   parent     - owns the child
//   specialist - is currently linked to the child (see M2)
//   child      - is the child's own account
// Every other caller, including an unlinked specialist and a request for a
// child that does not exist, gets the same 403 so that nothing leaks.

function roleOnChild(db, user, child) {
  if (user.role === 'parent' && child.parent_id === user.id) return 'parent';
  if (user.role === 'child' && child.user_id === user.id) return 'child';
  if (
    user.role === 'specialist' &&
    db
      .prepare('SELECT 1 FROM links WHERE child_id = ? AND specialist_id = ?')
      .get(child.id, user.id)
  ) {
    return 'specialist';
  }
  return null;
}

function childAccess(db, allowedRoles) {
  return (req, res, next) => {
    const childId = Number(req.params.childId);
    const child = Number.isInteger(childId)
      ? db.prepare('SELECT * FROM children WHERE id = ?').get(childId)
      : undefined;
    const role = child ? roleOnChild(db, req.user, child) : null;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Bu çocuk için bu işleme yetkiniz yok.' });
    }
    req.child = child;
    req.childRole = role;
    next();
  };
}

module.exports = { childAccess, roleOnChild };

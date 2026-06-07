// ---------------------------------------------------------------------------
//  roleHome — rolga qarab boshlang'ich (redirect) sahifa yo'lini qaytaradi.
//    admin -> /admin, owner -> /owner, qolganlari (user) -> /
// ---------------------------------------------------------------------------
export const roleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'owner') return '/owner';
  return '/';
};

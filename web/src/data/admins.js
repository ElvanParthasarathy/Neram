// Hardcoded Admin Roles
export const HARDCODED_ADMINS = {
  "jaiprakashpartha@gmail.com": "super_admin",
  "jaiprakashvp2006@gmail.com": "faculty",
  "23104055@rmd.ac.in": "rep"
};

// Legacy array for backward compatibility (includes all hardcoded admins)
export const adminEmails = Object.keys(HARDCODED_ADMINS);

export const getHardcodedRole = (email) => {
  if (!email) return null;
  return HARDCODED_ADMINS[email] || HARDCODED_ADMINS[email.toLowerCase()] || null;
};
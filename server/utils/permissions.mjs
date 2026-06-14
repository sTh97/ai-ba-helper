import { DATA_ACCESS } from "../constants/modules.mjs";

export const getModulePermission = (user, module) => {
  if (!user?.role?.permissions) return null;
  return user.role.permissions.find((p) => p.module === module) || null;
};

export const hasPermission = (user, module, action) => {
  const perm = getModulePermission(user, module);
  if (!perm) return false;
  return Boolean(perm[action]);
};

export const hasDataAccessAll = (user, module) => {
  const perm = getModulePermission(user, module);
  return perm?.dataAccess === DATA_ACCESS.ALL;
};

export const buildOwnerFilter = (user, module) => {
  if (hasDataAccessAll(user, module)) return {};
  return { createdBy: user._id };
};

export const canAccessResource = (user, module, resource) => {
  if (!resource) return false;
  if (hasDataAccessAll(user, module)) return true;
  const ownerId = resource.createdBy?.toString?.() || resource.createdBy;
  return ownerId === user._id.toString();
};

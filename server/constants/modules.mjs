export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projects", label: "Projects" },
  { key: "stories", label: "User Stories" },
  { key: "applications", label: "Create Application" },
  { key: "marketing", label: "Marketing Collateral" },
  { key: "solution", label: "Solution Architecture" },
  { key: "ai", label: "AI Tools" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles" },
];

export const DATA_ACCESS = {
  OWN: "own",
  ALL: "all",
};

export const CRUD_ACTIONS = ["create", "read", "update", "delete"];

export const buildDefaultPermissions = (overrides = {}) =>
  MODULES.map(({ key }) => ({
    module: key,
    create: false,
    read: false,
    update: false,
    delete: false,
    dataAccess: DATA_ACCESS.OWN,
    ...overrides[key],
  }));

export const buildFullPermissions = () =>
  MODULES.map(({ key }) => ({
    module: key,
    create: true,
    read: true,
    update: true,
    delete: true,
    dataAccess: DATA_ACCESS.ALL,
  }));

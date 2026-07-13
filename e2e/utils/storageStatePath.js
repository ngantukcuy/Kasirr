const path = require('path');

// Single source of truth for where the authenticated session is saved.
// Referenced directly (not via config.projects[...].use.storageState)
// because that value differs per-project (the "auth-flows" project
// intentionally overrides it to an empty state), so reading it back
// out of the resolved config in global-setup.js is unreliable.
const STORAGE_STATE_PATH = path.resolve(__dirname, '..', 'storage', 'auth.json');

module.exports = { STORAGE_STATE_PATH };

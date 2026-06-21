const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Silences the Xcode 15+ linker warning:
 *   "ignoring duplicate libraries: '-lc++'"
 *
 * React Native + several pods each pass `-lc++` to the final app link, which the
 * new linker flags as a (harmless) duplicate. Apple's documented opt-out is the
 * `-no_warn_duplicate_libraries` linker flag; we add it to the app target's
 * OTHER_LDFLAGS. Build behavior is unchanged — only the warning goes away.
 */
const FLAG = '-Wl,-no_warn_duplicate_libraries';
const QUOTED = `"${FLAG}"`;

module.exports = function withNoDuplicateLibWarning(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(buildConfigs)) {
      const entry = buildConfigs[key];
      const settings = entry && typeof entry === 'object' ? entry.buildSettings : undefined;
      // Only real app/native targets carry PRODUCT_NAME; skip comment entries
      // and aggregate configs.
      if (!settings || !('PRODUCT_NAME' in settings)) continue;

      let flags = settings.OTHER_LDFLAGS;
      if (flags == null) flags = ['"$(inherited)"'];
      else if (!Array.isArray(flags)) flags = [flags];

      if (!flags.includes(QUOTED) && !flags.includes(FLAG)) {
        flags.push(QUOTED);
      }
      settings.OTHER_LDFLAGS = flags;
    }

    return cfg;
  });
};

import "server-only";

import {
  getDevelopmentEnvironmentWarningLabels,
  shouldShowDevelopmentEnvironmentHint,
} from "@/lib/environment-safety.server";

export {
  getDevelopmentEnvironmentWarningLabels,
  shouldShowDevelopmentEnvironmentHint,
};

/** @deprecated Use shouldShowDevelopmentEnvironmentHint */
export function shouldShowSharedDbDevWarning(): boolean {
  return shouldShowDevelopmentEnvironmentHint();
}

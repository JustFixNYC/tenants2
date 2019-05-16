/**
 * Note that the typing for this interface isn't the full
 * API that FullStory supports, but it's what we use right now.
 */
declare interface FullStoryInterface {
  /** https://help.fullstory.com/develop-js/identify */
  identify(uid: string, userVars?: {
    /** Displays nice-looking user names in the FullStory UI. */
    displayName?: string,
    /** Activates "Email this user" option in FullStory UI. */
    email?: string
  }): void;
}

interface Window {
  /**
   * Depending on whether FullStory support is enabled, this
   * object may not exist, so always test for its existence.
   */
  FS?: FullStoryInterface;
}

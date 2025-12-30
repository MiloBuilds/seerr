import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import { MediaServerType } from '@server/constants/server';
import type Media from '@server/entity/Media';
import type { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';

class JellyfinPermissions {
  private hasAccess(
    user: User | undefined,
    libraryIds: string[] | null | undefined
  ): boolean {
    if (user?.jellyfinEnableAllFolders) {
      return true;
    }

    if (libraryIds && user?.jellyfinEnabledFolders) {
      return libraryIds.some((id) => user.jellyfinEnabledFolders?.includes(id));
    }

    return false;
  }

  private filterStatus(userId: number, media: Media, is4k: boolean) {
    let status = is4k ? media.status4k : media.status;
    if (
      status === MediaStatus.AVAILABLE ||
      status === MediaStatus.PARTIALLY_AVAILABLE ||
      status === MediaStatus.DELETED
    ) {
      // Note that requests can be "undefined".
      const hasActiveRequest = media.requests?.some(
        (req) =>
          req.requestedBy?.id === userId &&
          req.status !== MediaRequestStatus.DECLINED &&
          req.status !== MediaRequestStatus.FAILED
      );

      status = hasActiveRequest ? MediaStatus.PROCESSING : MediaStatus.UNKNOWN;
    }
    if (is4k) {
      media.status4k = status;
    } else {
      media.status = status;
    }
    // Filter the seasons for standard and 4k media.
    // Note that seasons can be "not iterable".
    if (media.seasons) {
      for (const season of media.seasons) {
        if (is4k) {
          season.status4k = status;
        } else {
          season.status = status;
        }
      }
    }
  }

  async filterMedia(
    user: User | undefined,
    media: Media[] | Media | undefined | null
  ): Promise<void> {
    const settings = getSettings();
    if (
      !media ||
      settings.main.mediaServerType !== MediaServerType.JELLYFIN ||
      !settings.jellyfin.syncLibraryPermissions ||
      !user ||
      !user.jellyfinUserId ||
      user?.jellyfinEnableAllFolders
    ) {
      return;
    }

    const mediaList = Array.isArray(media) ? media : [media];
    console.log(media);
    for (const item of mediaList) {
      // Filter standard media.
      if (!this.hasAccess(user, item.jellyfinLibraryId)) {
        item.jellyfinMediaId = null;
        item.jellyfinLibraryId = null;
        item.mediaUrl = '';
        this.filterStatus(user.id, item, false);
      }

      // Filter 4k media.
      if (!this.hasAccess(user, item.jellyfinLibraryId4k)) {
        item.jellyfinMediaId4k = null;
        item.jellyfinLibraryId4k = null;
        item.mediaUrl4k = '';
        this.filterStatus(user.id, item, true);
      }
    }
  }

  public hasAccessToMedia(
    user: User | undefined,
    media: Media,
    is4k?: boolean
  ): boolean {
    const settings = getSettings();
    if (
      settings.main.mediaServerType !== MediaServerType.JELLYFIN ||
      !settings.jellyfin.syncLibraryPermissions ||
      !user ||
      !user.jellyfinUserId
    ) {
      return true;
    }
    return this.hasAccess(
      user,
      is4k ? media.jellyfinLibraryId4k : media.jellyfinLibraryId
    );
  }
}

const jellyfinPermissions = new JellyfinPermissions();

export default jellyfinPermissions;

import JellyfinAPI from '@server/api/jellyfin';
import { MediaServerType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { getHostname } from '@server/utils/getHostname';
import { isEqual } from 'lodash';

class JellyfinUserSync implements RunnableScanner<StatusBase> {
  private running = false;
  private progress = 0;
  private total = 0;

  public async run() {
    const settings = getSettings();
    if (
      settings.main.mediaServerType !== MediaServerType.JELLYFIN ||
      !settings.jellyfin.syncLibraryPermissions
    ) {
      return;
    }

    this.running = true;
    this.progress = 0;

    try {
      const userRepository = getRepository(User);
      const admin = await userRepository.findOne({
        where: { id: 1 },
        select: ['id', 'jellyfinUserId', 'jellyfinDeviceId'],
        order: { id: 'ASC' },
      });

      if (!admin || !admin.jellyfinDeviceId || !admin.jellyfinUserId) {
        logger.warn('Admin not configured properly.', {
          label: 'Jellyfin User Sync',
        });
        return;
      }

      const jellyfinClient = new JellyfinAPI(
        getHostname(),
        settings.jellyfin.apiKey,
        admin.jellyfinDeviceId
      );
      jellyfinClient.setUserId(admin.jellyfinUserId);

      const jellyfinUsersResponse = await jellyfinClient.getUsers();
      const jellyfinUsersMap = new Map(
        jellyfinUsersResponse.users.map((u) => [u.Id, u])
      );

      const localUsers = await userRepository
        .createQueryBuilder('user')
        .where('user.jellyfinUserId IS NOT NULL')
        .getMany();

      this.total = localUsers.length;

      for (const user of localUsers) {
        if (!this.running) {
          break;
        }

        // We know jellyfinUserId is not null due to the query, but TS might not.
        if (user.jellyfinUserId) {
          const jfUser = jellyfinUsersMap.get(user.jellyfinUserId);
          if (jfUser) {
            const currentEnabledFolders = (user.jellyfinEnabledFolders || [])
              .slice()
              .sort();
            const fetchedEnabledFolders = (jfUser.Policy.EnabledFolders || [])
              .slice()
              .sort();

            const hasChanged =
              user.jellyfinEnableAllFolders !==
                jfUser.Policy.EnableAllFolders ||
              !isEqual(currentEnabledFolders, fetchedEnabledFolders);

            if (hasChanged) {
              await userRepository.update(user.id, {
                jellyfinEnableAllFolders: jfUser.Policy.EnableAllFolders,
                jellyfinEnabledFolders: jfUser.Policy.EnabledFolders,
              });
            }
          }
        }
        this.progress++;
      }

      logger.info('Jellyfin User Permission Sync Complete', {
        label: 'Jellyfin User Sync',
      });
    } catch (e) {
      logger.error('Jellyfin User Permission Sync Failed', {
        label: 'Jellyfin User Sync',
        message: e.message,
      });
    } finally {
      this.running = false;
    }
  }

  public status(): StatusBase {
    return {
      running: this.running,
      progress: this.progress,
      total: this.total,
    };
  }

  public cancel() {
    this.running = false;
  }
}

export const jellyfinUserSync = new JellyfinUserSync();

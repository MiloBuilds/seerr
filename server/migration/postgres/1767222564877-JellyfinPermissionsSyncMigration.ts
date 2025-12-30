import type { MigrationInterface, QueryRunner } from 'typeorm';

export class JellyfinPermissionsSyncMigration1767222564877
  implements MigrationInterface
{
  name = 'JellyfinPermissionsSyncMigration1767222564877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" DROP CONSTRAINT "UQ_6427d07d9a171a3a1ab87480005"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "jellyfinEnabledFolders" text`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "jellyfinEnableAllFolders" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "media" ADD "jellyfinLibraryId" text`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "jellyfinLibraryId4k" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "jellyfinLibraryId4k"`
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "jellyfinLibraryId"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "jellyfinEnableAllFolders"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "jellyfinEnabledFolders"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" ADD CONSTRAINT "UQ_6427d07d9a171a3a1ab87480005" UNIQUE ("endpoint", "userId")`
    );
  }
}

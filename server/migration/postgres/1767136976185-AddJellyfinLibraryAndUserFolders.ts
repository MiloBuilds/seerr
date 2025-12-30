import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJellyfinLibraryAndUserFolders1767136976185
  implements MigrationInterface
{
  name = 'AddJellyfinLibraryAndUserFolders1767136976185';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}

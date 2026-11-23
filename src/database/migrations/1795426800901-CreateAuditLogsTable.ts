import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1795426800901 implements MigrationInterface {
  name = 'CreateAuditLogsTable1795426800901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(100) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid, "actor_id" uuid, "metadata" jsonb, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "source_event_id" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_audit_logs_source_event_id" ON "audit_logs"  ("source_event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor_occurred" ON "audit_logs"  ("actor_id", "occurred_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_occurred" ON "audit_logs"  ("entity_type", "entity_id", "occurred_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_entity_occurred"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_actor_occurred"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_audit_logs_source_event_id"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}

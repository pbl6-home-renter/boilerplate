import { Column, Entity } from 'typeorm';
import { AbstractEntity } from 'shared/infra/typeorm/persistence/type-orm.abstract.entity';

@Entity('samples')
export class SampleTypeormEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

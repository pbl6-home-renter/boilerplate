import { BaseEntity } from 'shared/domain/entities/base.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { generateUuid } from 'utils/uuid.utils';

export interface CreateSampleProps {
  id?: Uuid;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export class SampleEntity extends BaseEntity {
  private _title: string;
  private _description?: string;

  private constructor(
    id: Uuid,
    title: string,
    description: string | undefined,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean = false,
  ) {
    super(id, createdAt, updatedAt, isDeleted);
    this._title = title;
    this._description = description;
  }

  static create(props: CreateSampleProps): SampleEntity {
    return new SampleEntity(
      props.id ?? generateUuid(),
      props.title,
      props.description,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.isDeleted ?? false,
    );
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  updateTitle(title: string): void {
    this._title = title;
  }

  updateDescription(description: string): void {
    this._description = description;
  }
}

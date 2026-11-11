import { SampleEntity } from 'modules/sample/domain/entities/sample.entity';
import { SAMPLE_EVENTS } from 'modules/sample/domain/constants/sample-event.constants';
import { generateUuid } from 'shared/domain/value-objects/uuid.vo';

describe('SampleEntity', () => {
  it('raises a created event with the new aggregate state', () => {
    const id = generateUuid();
    const sample = SampleEntity.create({
      id,
      title: 'A sample',
      description: 'For unit tests',
    });

    expect(sample.pullDomainEvents()).toEqual([
      expect.objectContaining({
        eventType: SAMPLE_EVENTS.CREATED,
        aggregateId: id,
        title: 'A sample',
        description: 'For unit tests',
      }),
    ]);
  });

  it('raises one deleted event when deletion is repeated', () => {
    const id = generateUuid();
    const sample = SampleEntity.reconstitute({
      id,
      title: 'A sample',
    });

    sample.delete();
    sample.delete();

    expect(sample.isDeleted).toBe(true);
    expect(sample.pullDomainEvents()).toEqual([
      expect.objectContaining({
        eventType: SAMPLE_EVENTS.DELETED,
        aggregateId: id,
      }),
    ]);
  });
});

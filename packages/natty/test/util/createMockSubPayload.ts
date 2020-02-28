import { ISubscriptionPayload } from '../../src/interfaces/ISubscriptionPayload';

export const createMockSubPayload = (
  {
    msg = { data: {}, meta: {} },
    reply,
    subject = 'test.subject',
    sid = '1',
    type = 'action',
  }: ISubscriptionPayload = {} as any,
) => ({ msg, reply, subject, sid, type });

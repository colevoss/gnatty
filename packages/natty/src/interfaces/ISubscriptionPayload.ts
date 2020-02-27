export interface ISubscriptionPayload<Data = any, Meta = any> {
  msg: {
    data: Data;
    meta: Meta;
  };
  reply?: string;
  subject: string;
  sid: string;
  type: "action" | "subscription";
}

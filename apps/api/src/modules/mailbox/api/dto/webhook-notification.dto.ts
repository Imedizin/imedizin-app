export class WebhookNotificationChangeDto {
  subscriptionId: string;
  changeType: 'created' | 'updated' | 'deleted';
  resource: string;
  resourceData?: {
    id: string;
    '@odata.type': string;
    '@odata.id': string;
  };
  clientState?: string;
  subscriptionExpirationDateTime: string;
  tenantId: string;
}

export class WebhookNotificationDto {
  value: WebhookNotificationChangeDto[];
  validationTokens?: string[];
}

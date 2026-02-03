/**
 * DTO for mailbox response
 */
export class MailboxResponseDto {
  id: string;
  address: string;
  name: string;
  createdAt: Date;

  constructor(mailbox: {
    id: string;
    address: string;
    name: string;
    createdAt?: Date;
  }) {
    this.id = mailbox.id;
    this.address = mailbox.address;
    this.name = mailbox.name;
    this.createdAt = mailbox.createdAt || new Date();
  }
}

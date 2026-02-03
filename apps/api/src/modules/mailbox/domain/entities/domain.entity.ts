/**
 * Domain domain entity
 * Represents an email domain like ourdomain.com
 */
export class Domain {
  constructor(
    public id: string,
    public domain: string,
    public name: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  /**
   * Update domain name
   */
  updateName(name: string): void {
    this.name = name;
  }

  /**
   * Update domain value
   */
  updateDomain(domain: string): void {
    this.domain = domain;
  }
}

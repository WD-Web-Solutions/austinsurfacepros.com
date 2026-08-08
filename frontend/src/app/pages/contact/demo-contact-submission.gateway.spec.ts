import { DemoContactSubmissionGateway } from './demo-contact-submission.gateway';

describe('DemoContactSubmissionGateway', () => {
  it('clearly reports that a demo submission is not persisted', () => {
    const gateway = new DemoContactSubmissionGateway();
    let message = '';

    gateway
      .submit({
        name: 'Taylor Client',
        emailAddress: 'taylor@example.com',
        service: 'Parking Lot Striping',
        message: 'Please provide an estimate.'
      })
      .subscribe(response => {
        message = response.message;
      });

    expect(message).toContain('Demo only');
    expect(message).toContain('not sent or saved');
  });
});

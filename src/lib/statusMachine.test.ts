import {
  canConvertToInvoice,
  canDelete,
  canEdit,
  canIssue,
  canLogSettlement,
  canMarkViewed,
  canVoid,
  getDisplayStatus,
  isOverdue,
  statusLabel,
} from './statusMachine';

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const YESTERDAY = isoDaysFromToday(-1);
const TOMORROW = isoDaysFromToday(1);

describe('getDisplayStatus', () => {
  it('returns draft as-is', () => {
    expect(getDisplayStatus({ status: 'draft', due_date: null, total_minor: 1000, amount_paid_minor: 0 })).toBe(
      'draft'
    );
  });

  it('returns paid as-is, even with a past due date', () => {
    expect(
      getDisplayStatus({ status: 'paid', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 1000 })
    ).toBe('paid');
  });

  it('returns void as-is', () => {
    expect(getDisplayStatus({ status: 'void', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 0 })).toBe(
      'void'
    );
  });

  it('derives overdue for an issued document past its due date with a balance', () => {
    expect(
      getDisplayStatus({ status: 'issued', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 0 })
    ).toBe('overdue');
  });

  it('derives overdue for a partially_paid document past its due date with a balance', () => {
    expect(
      getDisplayStatus({ status: 'partially_paid', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 400 })
    ).toBe('overdue');
  });

  it('does not derive overdue when the due date is in the future', () => {
    expect(
      getDisplayStatus({ status: 'issued', due_date: TOMORROW, total_minor: 1000, amount_paid_minor: 0 })
    ).toBe('issued');
  });

  it('does not derive overdue when there is no balance left, even past the due date', () => {
    expect(
      getDisplayStatus({ status: 'issued', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 1000 })
    ).toBe('issued');
  });

  it('does not derive overdue when there is no due date set', () => {
    expect(getDisplayStatus({ status: 'issued', due_date: null, total_minor: 1000, amount_paid_minor: 0 })).toBe(
      'issued'
    );
  });
});

describe('isOverdue', () => {
  it('mirrors getDisplayStatus', () => {
    expect(isOverdue({ status: 'issued', due_date: YESTERDAY, total_minor: 1000, amount_paid_minor: 0 })).toBe(
      true
    );
    expect(isOverdue({ status: 'issued', due_date: TOMORROW, total_minor: 1000, amount_paid_minor: 0 })).toBe(
      false
    );
  });
});

describe('canEdit', () => {
  it('allows editing only drafts', () => {
    expect(canEdit({ status: 'draft' })).toBe(true);
    expect(canEdit({ status: 'issued' })).toBe(false);
    expect(canEdit({ status: 'paid' })).toBe(false);
  });
});

describe('canDelete', () => {
  it('allows deleting a document with no converted counterpart', () => {
    expect(canDelete({ converted_to_document_id: null })).toBe(true);
  });

  it('blocks deleting an estimate that has already been converted to an invoice', () => {
    expect(canDelete({ converted_to_document_id: 'some-invoice-id' })).toBe(false);
  });
});

describe('canIssue', () => {
  it('allows issuing only drafts', () => {
    expect(canIssue({ status: 'draft' })).toBe(true);
    expect(canIssue({ status: 'issued' })).toBe(false);
  });
});

describe('canVoid', () => {
  it('allows voiding draft, issued, and partially_paid documents', () => {
    expect(canVoid({ status: 'draft' })).toBe(true);
    expect(canVoid({ status: 'issued' })).toBe(true);
    expect(canVoid({ status: 'partially_paid' })).toBe(true);
  });

  it('blocks voiding paid or already-void documents', () => {
    expect(canVoid({ status: 'paid' })).toBe(false);
    expect(canVoid({ status: 'void' })).toBe(false);
  });
});

describe('canLogSettlement', () => {
  it('allows logging a payment on an open invoice', () => {
    expect(canLogSettlement({ doc_type: 'invoice', status: 'issued' })).toBe(true);
    expect(canLogSettlement({ doc_type: 'invoice', status: 'partially_paid' })).toBe(true);
  });

  it('blocks logging a payment on an estimate', () => {
    expect(canLogSettlement({ doc_type: 'estimate', status: 'issued' })).toBe(false);
  });

  it('blocks logging a payment on a draft or already-paid invoice', () => {
    expect(canLogSettlement({ doc_type: 'invoice', status: 'draft' })).toBe(false);
    expect(canLogSettlement({ doc_type: 'invoice', status: 'paid' })).toBe(false);
  });
});

describe('canConvertToInvoice', () => {
  it('allows converting a draft or issued estimate that has not been converted yet', () => {
    expect(
      canConvertToInvoice({ doc_type: 'estimate', status: 'draft', converted_to_document_id: null })
    ).toBe(true);
    expect(
      canConvertToInvoice({ doc_type: 'estimate', status: 'issued', converted_to_document_id: null })
    ).toBe(true);
  });

  it('blocks converting an already-converted estimate (the Round 15 delete-crash root cause)', () => {
    expect(
      canConvertToInvoice({ doc_type: 'estimate', status: 'issued', converted_to_document_id: 'inv-1' })
    ).toBe(false);
  });

  it('blocks converting an invoice', () => {
    expect(
      canConvertToInvoice({ doc_type: 'invoice', status: 'draft', converted_to_document_id: null })
    ).toBe(false);
  });
});

describe('canMarkViewed', () => {
  it('allows marking an issued, unviewed document as viewed', () => {
    expect(canMarkViewed({ status: 'issued', viewed_at: null })).toBe(true);
  });

  it('blocks marking a draft as viewed', () => {
    expect(canMarkViewed({ status: 'draft', viewed_at: null })).toBe(false);
  });

  it('blocks marking a void document as viewed', () => {
    expect(canMarkViewed({ status: 'void', viewed_at: null })).toBe(false);
  });

  it('blocks marking an already-viewed document as viewed again', () => {
    expect(canMarkViewed({ status: 'issued', viewed_at: '2026-01-01T00:00:00.000Z' })).toBe(false);
  });
});

describe('statusLabel', () => {
  it('maps every display status to its plain-language label', () => {
    expect(statusLabel('draft')).toBe('Draft');
    expect(statusLabel('issued')).toBe('Issued');
    expect(statusLabel('partially_paid')).toBe('Partially Paid');
    expect(statusLabel('paid')).toBe('Paid');
    expect(statusLabel('overdue')).toBe('Overdue');
    expect(statusLabel('void')).toBe('Canceled');
  });
});

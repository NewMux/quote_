import { create } from 'zustand';
import { normalizePaymentLink } from '../lib/paymentLink';
import { newId } from '../lib/id';
import {
  getDocument,
  saveDocumentEdit,
  type DocumentHeaderInput,
} from '../db/repositories/documents.repo';
import { listLineItems } from '../db/repositories/lineItems.repo';
import type {
  DiscountType,
  DocStatus,
  DocType,
  ItemCatalogEntry,
  LineItemEditable,
  TaxBracket,
} from '../types/models';
import { t } from '../lib/i18n';

interface DocumentEditorState {
  documentId: string | null;
  docType: DocType;
  docNumber: string;
  status: DocStatus;
  clientId: string | null;
  clientNameSnapshot: string | null;
  issueDate: string | null;
  dueDate: string | null;
  expiryDate: string | null;
  notes: string;
  termsOverride: string;
  paymentLink: string;
  discountType: DiscountType | null;
  discountValue: number | null;
  currencyCode: string;
  lines: LineItemEditable[];
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  /** Bumped on every edit, so a save only marks the editor clean if nothing changed while it was
   * in flight. */
  revision: number;
  /** Why the document couldn't be opened for editing (missing, no longer a draft, or a network
   * error); null while loading or once loaded. */
  loadError: string | null;
  saveError: string | null;

  loadDocument: (id: string) => Promise<void>;
  reset: () => void;
  setClient: (clientId: string | null, clientName: string | null) => void;
  setIssueDate: (value: string | null) => void;
  setDueDate: (value: string | null) => void;
  setExpiryDate: (value: string | null) => void;
  setNotes: (value: string) => void;
  setTermsOverride: (value: string) => void;
  setPaymentLink: (value: string) => void;
  setDocumentDiscount: (type: DiscountType | null, value: number | null) => void;
  addLineItemFromCatalog: (item: ItemCatalogEntry, taxBracket: TaxBracket | null) => void;
  addBlankLineItem: () => void;
  updateLineItem: (id: string, patch: Partial<LineItemEditable>) => void;
  removeLineItem: (id: string) => void;
  save: () => Promise<void>;
}

const initialState = {
  documentId: null as string | null,
  docType: 'invoice' as DocType,
  docNumber: '',
  status: 'draft' as DocStatus,
  clientId: null as string | null,
  clientNameSnapshot: null as string | null,
  issueDate: null as string | null,
  dueDate: null as string | null,
  expiryDate: null as string | null,
  notes: '',
  termsOverride: '',
  paymentLink: '',
  discountType: null as DiscountType | null,
  discountValue: null as number | null,
  currencyCode: 'USD',
  lines: [] as LineItemEditable[],
  isLoading: false,
  isSaving: false,
  isDirty: false,
  revision: 0,
  loadError: null as string | null,
  saveError: null as string | null,
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : t('Something went wrong.');
}

/** The save currently in flight. Saves run one at a time, in order, so an older save can never
 * land after (and overwrite) a newer one. */
let saveChain: Promise<unknown> = Promise.resolve();

export const useDocumentEditorStore = create<DocumentEditorState>((set, get) => ({
  ...initialState,

  loadDocument: async (id) => {
    set({ ...initialState, isLoading: true });
    let doc: Awaited<ReturnType<typeof getDocument>>;
    let rows: Awaited<ReturnType<typeof listLineItems>>;
    try {
      doc = await getDocument(id);
      if (!doc) {
        set({ isLoading: false, loadError: t('This document no longer exists.') });
        return;
      }
      if (doc.status !== 'draft') {
        set({ isLoading: false, loadError: t('Only drafts can be edited. This document has already been issued.') });
        return;
      }
      rows = await listLineItems(id);
    } catch (err) {
      set({ isLoading: false, loadError: errorMessage(err) });
      return;
    }
    const lines: LineItemEditable[] = rows.map((r) => ({
      id: r.id,
      catalogItemId: r.catalog_item_id,
      description: r.description,
      quantity: r.quantity,
      unitLabel: r.unit_label,
      unitPriceMinor: r.unit_price_minor,
      discountType: r.discount_type,
      discountValue: r.discount_value,
      isTaxable: r.is_taxable === 1,
      taxBracketId: r.tax_bracket_id,
      taxBracketNameSnapshot: r.tax_bracket_name_snapshot,
      taxRateBp: r.tax_rate_bp,
    }));
    set({
      documentId: doc.id,
      docType: doc.doc_type,
      docNumber: doc.doc_number,
      status: doc.status,
      clientId: doc.client_id,
      clientNameSnapshot: doc.client_name_snapshot,
      issueDate: doc.issue_date,
      dueDate: doc.due_date,
      expiryDate: doc.expiry_date,
      notes: doc.notes ?? '',
      termsOverride: doc.terms_override ?? '',
      paymentLink: doc.payment_link ?? '',
      discountType: doc.discount_type,
      discountValue: doc.discount_value,
      currencyCode: doc.currency_code,
      lines,
      isLoading: false,
      isDirty: false,
    });
  },

  reset: () => set({ ...initialState }),

  setClient: (clientId, clientName) =>
    set({ clientId, clientNameSnapshot: clientName, isDirty: true, revision: get().revision + 1 }),

  setIssueDate: (issueDate) => set({ issueDate, isDirty: true, revision: get().revision + 1 }),
  setDueDate: (dueDate) => set({ dueDate, isDirty: true, revision: get().revision + 1 }),
  setExpiryDate: (expiryDate) => set({ expiryDate, isDirty: true, revision: get().revision + 1 }),
  setNotes: (notes) => set({ notes, isDirty: true, revision: get().revision + 1 }),
  setTermsOverride: (termsOverride) => set({ termsOverride, isDirty: true, revision: get().revision + 1 }),
  setPaymentLink: (paymentLink) => set({ paymentLink, isDirty: true, revision: get().revision + 1 }),

  setDocumentDiscount: (discountType, discountValue) =>
    set({ discountType, discountValue, isDirty: true, revision: get().revision + 1 }),

  addLineItemFromCatalog: (item, taxBracket) =>
    set((state) => ({
      lines: [
        ...state.lines,
        {
          id: newId(),
          catalogItemId: item.id,
          description: item.name,
          quantity: 1,
          unitLabel: item.unit_label,
          unitPriceMinor: item.default_unit_price_minor,
          discountType: null,
          discountValue: null,
          isTaxable: item.is_taxable === 1,
          taxBracketId: taxBracket?.id ?? null,
          taxBracketNameSnapshot: taxBracket?.name ?? null,
          taxRateBp: taxBracket?.rate_bp ?? 0,
        },
      ],
      isDirty: true,
      revision: state.revision + 1,
    })),

  addBlankLineItem: () =>
    set((state) => ({
      lines: [
        ...state.lines,
        {
          id: newId(),
          catalogItemId: null,
          description: '',
          quantity: 1,
          unitLabel: null,
          unitPriceMinor: 0,
          discountType: null,
          discountValue: null,
          isTaxable: false,
          taxBracketId: null,
          taxBracketNameSnapshot: null,
          taxRateBp: 0,
        },
      ],
      isDirty: true,
      revision: state.revision + 1,
    })),

  updateLineItem: (id, patch) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      isDirty: true,
      revision: state.revision + 1,
    })),

  removeLineItem: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
      isDirty: true,
      revision: state.revision + 1,
    })),

  save: async () => {
    // Snapshot synchronously: the screen calls save() on unmount right before reset().
    const state = get();
    const { documentId, revision } = state;
    if (!documentId) return;
    const header: DocumentHeaderInput = {
      clientId: state.clientId,
      clientNameSnapshot: state.clientNameSnapshot,
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      expiryDate: state.expiryDate,
      notes: state.notes || null,
      termsOverride: state.termsOverride || null,
      paymentLink: normalizePaymentLink(state.paymentLink),
      discountType: state.discountType,
      discountValue: state.discountValue,
    };
    const lines = state.lines;
    set({ isSaving: true, saveError: null });

    const run = saveChain.catch(() => {}).then(() => saveDocumentEdit(documentId, header, lines));
    saveChain = run;
    const isCurrent = () => get().documentId === documentId;
    try {
      await run;
      // Edits made while this save was in flight are still unsaved — leave them dirty so the
      // autosave picks them up.
      if (isCurrent() && get().revision === revision) set({ isDirty: false });
    } catch (err) {
      if (isCurrent()) set({ saveError: errorMessage(err) });
      throw err;
    } finally {
      if (isCurrent() && saveChain === run) set({ isSaving: false });
    }
  },
}));

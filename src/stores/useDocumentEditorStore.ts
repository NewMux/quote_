import { create } from 'zustand';
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
  discountType: DiscountType | null;
  discountValue: number | null;
  currencyCode: string;
  lines: LineItemEditable[];
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;

  loadDocument: (id: string) => Promise<void>;
  reset: () => void;
  setClient: (clientId: string | null, clientName: string | null) => void;
  setIssueDate: (value: string | null) => void;
  setDueDate: (value: string | null) => void;
  setExpiryDate: (value: string | null) => void;
  setNotes: (value: string) => void;
  setTermsOverride: (value: string) => void;
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
  discountType: null as DiscountType | null,
  discountValue: null as number | null,
  currencyCode: 'USD',
  lines: [] as LineItemEditable[],
  isLoading: false,
  isSaving: false,
  isDirty: false,
};

export const useDocumentEditorStore = create<DocumentEditorState>((set, get) => ({
  ...initialState,

  loadDocument: async (id) => {
    set({ isLoading: true });
    const doc = await getDocument(id);
    if (!doc) {
      set({ isLoading: false });
      return;
    }
    const rows = await listLineItems(id);
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
    set({ clientId, clientNameSnapshot: clientName, isDirty: true }),

  setIssueDate: (issueDate) => set({ issueDate, isDirty: true }),
  setDueDate: (dueDate) => set({ dueDate, isDirty: true }),
  setExpiryDate: (expiryDate) => set({ expiryDate, isDirty: true }),
  setNotes: (notes) => set({ notes, isDirty: true }),
  setTermsOverride: (termsOverride) => set({ termsOverride, isDirty: true }),

  setDocumentDiscount: (discountType, discountValue) =>
    set({ discountType, discountValue, isDirty: true }),

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
    })),

  updateLineItem: (id, patch) =>
    set((state) => ({
      lines: state.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      isDirty: true,
    })),

  removeLineItem: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
      isDirty: true,
    })),

  save: async () => {
    const state = get();
    if (!state.documentId) return;
    set({ isSaving: true });
    const header: DocumentHeaderInput = {
      clientId: state.clientId,
      clientNameSnapshot: state.clientNameSnapshot,
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      expiryDate: state.expiryDate,
      notes: state.notes || null,
      termsOverride: state.termsOverride || null,
      discountType: state.discountType,
      discountValue: state.discountValue,
    };
    await saveDocumentEdit(state.documentId, header, state.lines);
    set({ isSaving: false, isDirty: false });
  },
}));

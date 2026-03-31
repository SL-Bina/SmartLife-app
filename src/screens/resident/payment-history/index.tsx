import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentInvoicesAPI } from '../../../services/resident-api';
import {
  asNumber,
  asString,
  extractList,
  formatCurrency,
  formatDate,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function PaymentHistorySection() {
  const loadPayments = async ({
    propertyId,
  }: {
    propertyId: number | string | null;
  }) => {
    const response = propertyId
      ? await residentInvoicesAPI.getByProperty(propertyId)
      : await residentInvoicesAPI.getAll();

    const source = extractList(response).map(item => toRecord(item));
    const paid = source.filter(item => asNumber(item.amount_paid) > 0 || asString(item.status) === 'paid');
    const totalPaid = paid.reduce((sum, item) => sum + asNumber(item.amount_paid || item.amount), 0);

    const items: ResidentListItem[] = paid.map((item, index) => ({
      id: asString(item.id) || `payment-${index + 1}`,
      title: pickText(item.service_name, item.title, `Ödəniş #${asString(item.id) || index + 1}`),
      subtitle: pickText(item.description, item.note),
      meta: formatDate(item.paid_at || item.updated_at || item.created_at),
      amount: formatCurrency(item.amount_paid || item.amount),
      status: pickText(item.status, 'paid'),
    }));

    return {
      items,
      metrics: [
        { label: 'Ödəniş sayı', value: String(paid.length) },
        { label: 'Cəmi ödənilib', value: formatCurrency(totalPaid) },
      ],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Ödəniş tarixçəsi"
      subtitle="Ödənilmiş fakturalar əsasında formalaşdırılır"
      emptyText="Ödəniş tarixçəsi tapılmadı"
      loadData={loadPayments}
    />
  );
}

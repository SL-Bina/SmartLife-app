import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentTicketsAPI } from '../../../services/resident-api';
import {
  asString,
  extractList,
  formatDate,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function TicketsSection() {
  const loadTickets = async ({
    propertyId,
  }: {
    propertyId: number | string | null;
  }) => {
    const params = propertyId ? { property_id: propertyId } : {};
    const response = await residentTicketsAPI.getAll(params);
    const list = extractList(response).map(item => toRecord(item));

    const items: ResidentListItem[] = list.map((item, index) => ({
      id: asString(item.id) || `ticket-${index + 1}`,
      title: pickText(item.title, item.ticket_number, `Müraciət #${asString(item.id) || index + 1}`),
      subtitle: pickText(item.description, item.category),
      meta: formatDate(item.created_at),
      status: pickText(item.status, '-'),
    }));

    const openCount = list.filter(item => ['pending', 'in_progress', 'open'].includes(asString(item.status))).length;

    return {
      items,
      metrics: [
        { label: 'Cəmi müraciət', value: String(list.length) },
        { label: 'Açıq', value: String(openCount) },
      ],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Müraciətlər"
      subtitle="Resident ticket endpoint-lərinə qoşulub"
      emptyText="Müraciət tapılmadı"
      loadData={loadTickets}
    />
  );
}

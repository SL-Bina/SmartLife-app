import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentEDocumentsAPI } from '../../../services/resident-api';
import {
  asString,
  extractList,
  formatDate,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function EDocumentsSection() {
  const loadDocuments = async ({
    propertyId,
  }: {
    propertyId: number | string | null;
  }) => {
    const params = propertyId ? { property_id: propertyId } : {};
    const response = await residentEDocumentsAPI.getAll(params);
    const list = extractList(response).map(item => toRecord(item));

    const items: ResidentListItem[] = list.map((item, index) => ({
      id: asString(item.id) || `document-${index + 1}`,
      title: pickText(item.title, item.name, `Sənəd #${asString(item.id) || index + 1}`),
      subtitle: pickText(item.description, item.type),
      meta: formatDate(item.created_at),
      status: pickText(item.status, '-'),
    }));

    return {
      items,
      metrics: [{ label: 'Sənəd sayı', value: String(list.length) }],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Elektron sənədlər"
      subtitle="Resident document endpoint-ləri"
      emptyText="Sənəd tapılmadı"
      loadData={loadDocuments}
    />
  );
}

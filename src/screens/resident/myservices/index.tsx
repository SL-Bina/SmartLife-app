import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentServicesAPI } from '../../../services/resident-api';
import {
  asString,
  extractList,
  formatDate,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function MyServicesSection() {
  const loadServices = async ({
    propertyId,
  }: {
    propertyId: number | string | null;
  }) => {
    const params = propertyId ? { property_id: propertyId } : {};
    const response = await residentServicesAPI.getAll(params);
    const list = extractList(response).map(item => toRecord(item));

    const items: ResidentListItem[] = list.map((item, index) => ({
      id: asString(item.id) || `service-${index + 1}`,
      title: pickText(item.name, item.service_name, `Xidmət #${asString(item.id) || index + 1}`),
      subtitle: pickText(item.description, item.note),
      meta: formatDate(item.created_at),
      status: pickText(item.status, '-'),
    }));

    return {
      items,
      metrics: [{ label: 'Xidmət sayı', value: String(list.length) }],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Xidmətlərim"
      subtitle="Resident service endpoint-ləri ilə bağlıdır"
      emptyText="Xidmət tapılmadı"
      loadData={loadServices}
    />
  );
}

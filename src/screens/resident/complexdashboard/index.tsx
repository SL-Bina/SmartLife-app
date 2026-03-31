import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentComplexDashboardAPI } from '../../../services/resident-api';
import {
  asString,
  extractList,
  formatDate,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function ComplexDashboardSection() {
  const loadComplexFeed = async ({
    propertyId,
  }: {
    propertyId: number | string | null;
  }) => {
    const params = propertyId ? { property_id: propertyId } : {};

    const [propertiesResult, postsResult] = await Promise.allSettled([
      residentComplexDashboardAPI.getMyProperties(),
      residentComplexDashboardAPI.getPosts(params),
    ]);

    const properties =
      propertiesResult.status === 'fulfilled'
        ? extractList(propertiesResult.value)
        : [];
    const posts =
      postsResult.status === 'fulfilled'
        ? extractList(postsResult.value)
        : [];

    const items: ResidentListItem[] = posts.map((value, index) => {
      const item = toRecord(value);
      return {
        id: asString(item.id) || `post-${index + 1}`,
        title: pickText(item.title, item.subject, `Paylaşım #${asString(item.id) || index + 1}`),
        subtitle: pickText(item.body, item.text, item.description),
        meta: formatDate(item.created_at),
        status: pickText(item.status, '-'),
      };
    });

    return {
      items,
      metrics: [
        { label: 'Mənzillərim', value: String(properties.length) },
        { label: 'Feed postları', value: String(posts.length) },
      ],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Kompleks lövhəsi"
      subtitle="Resident complex feed və property data axını"
      emptyText="Paylaşım tapılmadı"
      loadData={loadComplexFeed}
    />
  );
}

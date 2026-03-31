import React from 'react';

import ResidentModuleDataScreen from '../components/resident-module-data-screen';
import { residentProfileAPI } from '../../../services/resident-api';
import {
  asString,
  extractList,
  pickText,
  toRecord,
  type ResidentListItem,
} from '../resident-data-utils';

export default function ResidentProfileScreen() {
  const loadProfile = async () => {
    const response = await residentProfileAPI.getMe();
    const data = toRecord(toRecord(response).data);
    const meta = toRecord(data.meta);
    const properties = extractList(data.properties);

    const infoRows: ResidentListItem[] = [
      {
        id: 'profile-name',
        title: 'Ad Soyad',
        subtitle: pickText(data.name, data.full_name, '-'),
      },
      {
        id: 'profile-email',
        title: 'Email',
        subtitle: pickText(data.email, '-'),
      },
      {
        id: 'profile-phone',
        title: 'Telefon',
        subtitle: pickText(data.phone, '-'),
      },
      {
        id: 'profile-gender',
        title: 'Cins',
        subtitle: pickText(meta.gender, '-'),
      },
      {
        id: 'profile-birth',
        title: 'Doğum tarixi',
        subtitle: pickText(meta.birth_date, '-'),
      },
      {
        id: 'profile-code',
        title: 'Şəxsi kod',
        subtitle: pickText(meta.personal_code, '-'),
      },
    ];

    return {
      items: infoRows,
      metrics: [
        {
          label: 'Resident ID',
          value: asString(data.id) || '-',
        },
        {
          label: 'Mənzil sayı',
          value: String(properties.length),
        },
      ],
    };
  };

  return (
    <ResidentModuleDataScreen
      title="Profil"
      subtitle="Resident profil məlumatları"
      emptyText="Profil məlumatı tapılmadı"
      loadData={loadProfile}
    />
  );
}

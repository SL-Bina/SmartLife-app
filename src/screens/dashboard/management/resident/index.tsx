import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { residentsAPI } from '../../../../services/management';

export default function ManagementResidentScreen() {
	return (
		<ManagementEntityScreen
			title="Resident"
			entityLabel="Resident"
			api={residentsAPI}
			searchPlaceholder="Resident adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true },
				{ key: 'surname', label: 'Soyad' },
				{ key: 'email', label: 'Email', type: 'email' },
				{ key: 'phone', label: 'Telefon' },
				{ key: 'status', label: 'Status', type: 'number' },
			]}
			emptyMessage="Resident qeydi tapılmadı"
			enablePropertyBinding
			enableFieldReset
		/>
	);
}


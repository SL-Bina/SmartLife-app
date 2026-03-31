import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { buildingsAPI } from '../../../../services/management';

export default function ManagementBuildingScreen() {
	return (
		<ManagementEntityScreen
			title="Building"
			entityLabel="Building"
			api={buildingsAPI}
			searchPlaceholder="Building adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true },
				{ key: 'complex_id', label: 'Complex ID', type: 'number', required: true },
				{ key: 'address', label: 'Ünvan', multiline: true },
				{ key: 'status', label: 'Status', type: 'number' },
			]}
			emptyMessage="Building qeydi tapılmadı"
		/>
	);
}


import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { blocksAPI } from '../../../../services/management';

export default function ManagementBlockScreen() {
	return (
		<ManagementEntityScreen
			title="Block"
			entityLabel="Block"
			api={blocksAPI}
			searchPlaceholder="Block adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true },
				{ key: 'building_id', label: 'Building ID', type: 'number', required: true },
				{ key: 'description', label: 'Açıqlama', multiline: true },
				{ key: 'status', label: 'Status', type: 'number' },
			]}
			emptyMessage="Block qeydi tapılmadı"
		/>
	);
}


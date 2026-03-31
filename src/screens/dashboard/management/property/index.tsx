import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { propertiesAPI } from '../../../../services/management';

export default function ManagementPropertyScreen() {
	return (
		<ManagementEntityScreen
			title="Property"
			entityLabel="Property"
			api={propertiesAPI}
			searchPlaceholder="Property adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true },
				{ key: 'block_id', label: 'Block ID', type: 'number' },
				{ key: 'building_id', label: 'Building ID', type: 'number' },
				{ key: 'complex_id', label: 'Complex ID', type: 'number' },
				{ key: 'type_id', label: 'Type ID', type: 'number' },
				{ key: 'apartment_number', label: 'Apartment no' },
				{ key: 'area', label: 'Sahə', type: 'number' },
			]}
			emptyMessage="Property qeydi tapılmadı"
		/>
	);
}


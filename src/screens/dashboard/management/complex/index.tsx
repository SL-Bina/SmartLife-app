import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { complexesAPI } from '../../../../services/management';

export default function ManagementComplexScreen() {
	return (
		<ManagementEntityScreen
			title="Complex"
			entityLabel="Complex"
			api={complexesAPI}
			searchPlaceholder="Complex adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true },
				{ key: 'mtk_id', label: 'MTK ID', type: 'number', required: true },
				{ key: 'address', label: 'Ünvan', multiline: true },
				{ key: 'status', label: 'Status', type: 'number' },
			]}
			emptyMessage="Complex qeydi tapılmadı"
		/>
	);
}


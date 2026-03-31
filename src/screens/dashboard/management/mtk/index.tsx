import React from 'react';

import { ManagementEntityScreen } from '../../../../components/management';
import { mtkAPI } from '../../../../services/management';

export default function ManagementMtkScreen() {
	return (
		<ManagementEntityScreen
			title="MTK"
			entityLabel="MTK"
			api={mtkAPI}
			searchPlaceholder="MTK adı ilə axtar"
			fields={[
				{ key: 'name', label: 'Ad', required: true, placeholder: 'Nümunə MTK' },
				{ key: 'meta.lat', label: 'Enlik (lat)', type: 'number', placeholder: '40.4093' },
				{ key: 'meta.lng', label: 'Uzunluq (lng)', type: 'number', placeholder: '49.8671' },
				{ key: 'meta.desc', label: 'Təsvir', multiline: true, placeholder: 'Qısa təsvir daxil edin' },
				{ key: 'meta.address', label: 'Ünvan', multiline: true, placeholder: 'Tam ünvan' },
				{ key: 'meta.color_code', label: 'Rəng kodu', type: 'color', placeholder: '#3B82F6' },
				{ key: 'meta.phone', label: 'Telefon', type: 'phone', placeholder: '+994 50 000 00 00' },
				{ key: 'meta.email', label: 'E-poçt', type: 'email', placeholder: 'info@example.com' },
				{ key: 'meta.website', label: 'Veb sayt', placeholder: 'https://example.com' },
				{
					key: 'status',
					label: 'Status',
					type: 'select',
					defaultValue: 'active',
					options: [
						{ label: 'Aktiv', value: 'active' },
						{ label: 'Passiv', value: 'inactive' },
					],
				},
			]}
			emptyMessage="MTK qeydi tapılmadı"
		/>
	);
}


import { API_BASE_URL } from '../utils/auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiAuthOptions = {
	getToken?: () => string | null;
	onUnauthorized?: () => void;
};

type RequestOptions<Body = unknown> = {
	method?: HttpMethod;
	params?: Record<string, unknown>;
	body?: Body;
	headers?: Record<string, string>;
	token?: string | null;
	skipAuth?: boolean;
	preferValidationObject?: boolean;
};

type ErrorMap = Record<string, string[] | string>;

export type ApiError = {
	status?: number;
	message: string;
	errors?: ErrorMap;
	raw?: unknown;
};

let tokenProvider: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

const isFormDataBody = (value: unknown): value is FormData => {
	return typeof FormData !== 'undefined' && value instanceof FormData;
};

const encodeParamValue = (value: unknown): string => {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'string') {
		return value;
	}

	return String(value);
};

const serializeParams = (params: Record<string, unknown> = {}): string => {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach(item => {
				if (item !== null && item !== undefined) {
					searchParams.append(`${key}[]`, encodeParamValue(item));
				}
			});
			return;
		}

		if (value !== null && value !== undefined && value !== '') {
			searchParams.append(key, encodeParamValue(value));
		}
	});

	return searchParams.toString();
};

const formatValidationError = (payload: unknown): ApiError => {
	if (!payload || typeof payload !== 'object') {
		return {
			message: 'Validation failed',
			raw: payload,
		};
	}

	const data = payload as {
		message?: unknown;
		errors?: Record<string, unknown>;
	};

	const errors = data.errors && typeof data.errors === 'object'
		? (data.errors as ErrorMap)
		: undefined;

	const firstError = errors
		? Object.values(errors)[0]
		: undefined;

	const firstMessage = Array.isArray(firstError)
		? String(firstError[0])
		: firstError
			? String(firstError)
			: undefined;

	return {
		message: firstMessage || (typeof data.message === 'string' ? data.message : 'Validation failed'),
		errors,
		raw: payload,
	};
};

const toApiError = (
	payload: unknown,
	status?: number,
	preferValidationObject = false,
): ApiError => {
	if (preferValidationObject && status === 422) {
		const validationError = formatValidationError(payload);
		return {
			...validationError,
			status,
		};
	}

	if (payload && typeof payload === 'object') {
		const data = payload as {
			message?: unknown;
			errors?: ErrorMap;
		};

		if (typeof data.message === 'string') {
			return {
				status,
				message: data.message,
				errors: data.errors,
				raw: payload,
			};
		}
	}

	if (typeof payload === 'string' && payload.trim().length > 0) {
		return {
			status,
			message: payload,
			raw: payload,
		};
	}

	return {
		status,
		message: 'Unexpected API error',
		raw: payload,
	};
};

const parseResponseData = async (response: Response): Promise<unknown> => {
	const contentType = response.headers.get('content-type') || '';

	if (contentType.includes('application/json')) {
		return response.json().catch(() => null);
	}

	const text = await response.text().catch(() => '');
	return text.length > 0 ? text : null;
};

export function configureApiAuth(options: ApiAuthOptions): void {
	if (options.getToken) {
		tokenProvider = options.getToken;
	}

	if (options.onUnauthorized) {
		unauthorizedHandler = options.onUnauthorized;
	}
}

export async function requestApi<ResponseData = unknown, RequestBody = unknown>(
	path: string,
	options: RequestOptions<RequestBody> = {},
): Promise<ResponseData> {
	const method = options.method || 'GET';
	const queryString = options.params ? serializeParams(options.params) : '';
	const requestUrl = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

	const token = options.token ?? tokenProvider();
	const hasBody = options.body !== undefined;
	const isFormData = hasBody && isFormDataBody(options.body);
	const headers: Record<string, string> = {
		Accept: 'application/json',
		...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
		...(options.headers || {}),
	};

	if (!options.skipAuth && token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const requestBody = !hasBody
		? undefined
		: isFormData
			? (options.body as unknown as BodyInit)
			: JSON.stringify(options.body);

	const response = await fetch(requestUrl, {
		method,
		headers,
		body: requestBody,
	});

	const data = await parseResponseData(response);

	if (!response.ok) {
		if (response.status === 401 && !options.skipAuth) {
			unauthorizedHandler();
		}

		throw toApiError(data, response.status, options.preferValidationObject);
	}

	return data as ResponseData;
}

export const api = {
	get: <ResponseData = unknown>(
		path: string,
		options: Omit<RequestOptions<never>, 'method' | 'body'> = {},
	) => requestApi<ResponseData, never>(path, { ...options, method: 'GET' }),

	post: <ResponseData = unknown, RequestBody = unknown>(
		path: string,
		body?: RequestBody,
		options: Omit<RequestOptions<RequestBody>, 'method' | 'body'> = {},
	) => requestApi<ResponseData, RequestBody>(path, { ...options, method: 'POST', body }),

	put: <ResponseData = unknown, RequestBody = unknown>(
		path: string,
		body?: RequestBody,
		options: Omit<RequestOptions<RequestBody>, 'method' | 'body'> = {},
	) => requestApi<ResponseData, RequestBody>(path, { ...options, method: 'PUT', body }),

	patch: <ResponseData = unknown, RequestBody = unknown>(
		path: string,
		body?: RequestBody,
		options: Omit<RequestOptions<RequestBody>, 'method' | 'body'> = {},
	) => requestApi<ResponseData, RequestBody>(path, { ...options, method: 'PATCH', body }),

	delete: <ResponseData = unknown>(
		path: string,
		options: Omit<RequestOptions<never>, 'method' | 'body'> = {},
	) => requestApi<ResponseData, never>(path, { ...options, method: 'DELETE' }),
};

export default api;

import { defaultAxios } from "./axios";

type ApiRequest = {
    url: string,
    param?: Record<string, string | number>,
    values?: Record<string, unknown> | FormData
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "An error occurred."
): string {
  const axiosData = (
    err as { response?: { data?: { message?: string; error?: string } } }
  )?.response?.data;
  if (typeof axiosData?.message === "string" && axiosData.message.trim()) {
    return axiosData.message;
  }
  if (typeof axiosData?.error === "string" && axiosData.error.trim()) {
    return axiosData.error;
  }

  if (err && typeof err === "object") {
    const data = err as { message?: string; error?: string };
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return fallback;
}

const handleApiError = <T>(err: unknown): T | undefined => {
  const errorMessage = getApiErrorMessage(err);
  console.log(err);

  const data = (err as { response?: { data?: T } })?.response?.data;
  if (data) return data;
  return { error: errorMessage, message: errorMessage } as T;
};

export const getApi = async <T>({
    url,
    param,
}: ApiRequest): Promise<T | undefined> => {
    try {
        let apiUrl = url;
        if (param) {
            const queryString = new URLSearchParams();
            Object.entries(param).forEach(([Key,value]) => {
                queryString.append(Key, String(value))
            })
            apiUrl += `?${queryString.toString()}`
        }
        const response = await defaultAxios.get<T>(apiUrl)
        return response.data
    } catch (err) {
        return handleApiError<T>(err)
    }
}

export const postApi = async <T>({
    url,
    values,
    param,
}: ApiRequest): Promise<T | undefined> => {
    try {
        let apiUrl = url;
        if (param) {
            const queryString = new URLSearchParams();
            Object.entries(param).forEach(([key, value]) => {
                queryString.append(key, String(value));
            });
            apiUrl += `?${queryString.toString()}`;
        }
        const response = await defaultAxios.post<T>(apiUrl,values)
        return response.data
    } catch (err) {
        return handleApiError<T>(err)
    }
}

export const putApi = async <T>({
    url,
    values
}: ApiRequest): Promise<T | undefined> => {
    try {
        const response = await defaultAxios.put<T>(url, values, {
            headers: { "Content-Type": "application/json" },
        })
        return response.data
    } catch (err) {
        return handleApiError<T>(err)
    }
}

export const patchApi = async <T>({
    url,
    values,
    param,
}: ApiRequest): Promise<T | undefined> => {
    try {
        let apiUrl = url;
        if (param) {
            const queryString = new URLSearchParams();
            Object.entries(param).forEach(([key, value]) => {
                queryString.append(key, String(value));
            });
            apiUrl += `?${queryString.toString()}`;
        }
        const config =
            values instanceof FormData
                ? {}
                : { headers: { "Content-Type": "application/json" } }
        const response = await defaultAxios.patch<T>(apiUrl, values, config)
        return response.data
    } catch (err) {
        return handleApiError<T>(err)
    }
}

export const deleteApi = async <T>({
  url,
  param,
  values,
}: ApiRequest): Promise<T | undefined> => {
  try {
    let apiUrl = url;

    // Append query parameters if provided
    if (param) {
      const queryString = new URLSearchParams();
      Object.entries(param).forEach(([key, value]) => {
        queryString.append(key, String(value));
      });
      apiUrl += `?${queryString.toString()}`;
    }

    // Optional request body (axios supports body via the `data` config on DELETE)
    const config = values ? { data: values } : undefined;
    const response = await defaultAxios.delete<T>(apiUrl, config);
    return response.data;
  } catch (err) {
    return handleApiError<T>(err);
  }
}
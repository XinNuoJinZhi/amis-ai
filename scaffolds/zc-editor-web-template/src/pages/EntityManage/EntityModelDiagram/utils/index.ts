export const getUrlParams = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}
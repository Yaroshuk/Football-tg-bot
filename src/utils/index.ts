export const getParamFromURL = (url: string, param: string) => {
  const queryString = url.split('?')?.[1] ?? url.split('?')[0]

  const queryParams = new URLSearchParams(queryString)

  return queryParams.get(param)
}

import 'server-only'

type NetlifyResult = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

type NetlifyHandler = (event: {
  httpMethod: string
  body: string
  headers: Record<string, string>
  isBase64Encoded: boolean
}) => Promise<NetlifyResult>

export async function adapt(handler: NetlifyHandler, request: Request): Promise<Response> {
  const result = await handler({
    httpMethod: request.method,
    body: await request.text(),
    headers: Object.fromEntries(request.headers),
    isBase64Encoded: false,
  })

  return new Response(result.body, {
    status: result.statusCode,
    headers: { 'content-type': 'application/json', ...(result.headers ?? {}) },
  })
}

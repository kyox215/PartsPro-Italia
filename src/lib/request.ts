export async function parseRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await request.text();
    return text.trim() ? JSON.parse(text) : {};
  }

  if (!contentType) {
    const text = await request.text();
    return text.trim() ? JSON.parse(text) : {};
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

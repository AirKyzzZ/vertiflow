exports.handler = async () => ({
  statusCode: 410,
  body: JSON.stringify({ error: 'Checkout endpoint replaced' }),
});

require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');

const REQUIRED_VARS = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_CONVERSION_ACTION_ID',
];

const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`[googleAds] Advertencia: faltan variables de entorno: ${missing.join(', ')}`);
}

console.log('[googleAds] GOOGLE_ADS_CUSTOMER_ID:', process.env.GOOGLE_ADS_CUSTOMER_ID);

// Formatea la fecha como la API la espera: "yyyy-mm-dd hh:mm:ss+00:00"
function conversionDateTime() {
  return new Date()
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '+00:00');
}

/**
 * Sube una conversión offline de tipo Qualified Lead a Google Ads.
 * Solo debe llamarse cuando utm_source === 'paid_media' y gclid está presente.
 */
async function uploadQualifiedLeadConversion(gclid) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });

  const response = await customer.conversionUploads.uploadClickConversions({
    customer_id: customerId,
    conversions: [
      {
        gclid,
        conversion_action: `customers/${customerId}/conversionActions/${conversionActionId}`,
        conversion_date_time: conversionDateTime(),
      },
    ],
    partial_failure: true,
  });

  if (response.partial_failure_error) {
    throw new Error(`Google Ads partial failure: ${JSON.stringify(response.partial_failure_error)}`);
  }

  return response;
}

module.exports = { uploadQualifiedLeadConversion };

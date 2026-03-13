export const getExchangeRateSnapshot = async () => {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
        throw new Error('No se pudo consultar el servicio externo de tasas.');
    }

    const data = await response.json();
    return {
        provider: data.provider,
        baseCode: data.base_code,
        updatedAt: data.time_last_update_utc,
        arsRate: data.rates?.ARS || null,
        eurRate: data.rates?.EUR || null
    };
};

export const healthController = (_req, res) => {
    res.json({
        service: 'gastoclaro-api',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
};

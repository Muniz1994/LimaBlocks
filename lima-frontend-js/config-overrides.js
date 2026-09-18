module.exports = function override(config) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // Ignore 'fs' module
    };
    return config;
};
/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    // Empty turbopack config to silence the warning
    turbopack: {},
    // Exclude problematic native dependencies from webpack
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                "mongodb-client-encryption":
                    "commonjs mongodb-client-encryption",
                kerberos: "commonjs kerberos",
                snappy: "commonjs snappy",
                "@mongodb-js/zstd": "commonjs @mongodb-js/zstd",
                "gcp-metadata": "commonjs gcp-metadata",
                "@aws-sdk/credential-providers":
                    "commonjs @aws-sdk/credential-providers",
                socks: "commonjs socks",
            });
        }
        return config;
    },
};

export default nextConfig;
